import { OAuth2Client } from "google-auth-library";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Verify Google access token by fetching user info
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userInfoResponse.ok) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const payload = await userInfoResponse.json();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ message: "Email not found in Google token" });
    }

    // Check if user exists by email
    let user = await User.findOne({ email });

    if (user) {
      // User exists, update Google info if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
        if (!user.profilePic && picture) {
          user.profilePic = picture;
        }
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        email,
        fullName: name || email.split('@')[0],
        profilePic: picture || "",
        googleId,
        authProvider: "google",
        password: "", // No password for Google users
      });
      await user.save();
    }

    // Generate JWT token and set cookie
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      authProvider: user.authProvider,
    });
  } catch (error) {
    console.log("Error in googleAuth controller:", error.message);
    
    if (error.message.includes("Token used too late")) {
      return res.status(400).json({ message: "Google token has expired" });
    }
    
    res.status(500).json({ message: "Google authentication failed" });
  }
};
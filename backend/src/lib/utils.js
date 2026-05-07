import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const isProduction = process.env.NODE_ENV === "production";
  
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true, // prevent XSS attacks
    sameSite: isProduction ? "none" : "lax", // "none" for cross-origin in production
    secure: isProduction, // REQUIRED when sameSite is "none"
    domain: isProduction ? undefined : undefined, // Let browser handle domain
  });

  return token;
};

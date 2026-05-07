// Cookie debug middleware - remove in production
export const cookieDebug = (req, res, next) => {
  console.log("=== COOKIE DEBUG ===");
  console.log("Request origin:", req.headers.origin);
  console.log("Request host:", req.headers.host);
  console.log("Cookies received:", req.cookies);
  console.log("Cookie header:", req.headers.cookie);
  console.log("User-Agent:", req.headers["user-agent"]);
  console.log("=== END DEBUG ===");
  
  // Add CORS headers for debugging
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  next();
};
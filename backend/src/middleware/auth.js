import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { User } from "../models/User.js";

export function signToken(user) {
  return jwt.sign({ id: user._id || user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Authentication required" });

    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(401).json({ message: "User no longer exists" });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

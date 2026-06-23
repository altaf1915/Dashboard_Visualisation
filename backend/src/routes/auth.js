import { Router } from "express";
import asyncHandler from "express-async-handler";
import { User } from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email });

router.post("/register", asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password are required" });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "An account with this email already exists" });

  const user = await User.create({ name, email, password });
  res.status(201).json({ user: publicUser(user), token: signToken(user) });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.matchesPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({ user: publicUser(user), token: signToken(user) });
}));

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.post("/logout", requireAuth, (req, res) => {
  res.json({ message: "Logged out" });
});

export default router;

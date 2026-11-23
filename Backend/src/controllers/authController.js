import { prisma } from "../lib/prisma.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// In production, this should be in your .env file!
const JWT_SECRET = process.env.JWT_SECRET || "libraria_super_secret_key_2026";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    // 1. HARDCODED ADMIN CHECK
    // For portfolio purposes, we hardcode the admin credentials.
    if (email === "admin@libraria.com" && password === "admin123") {
      const token = jwt.sign({ role: "ADMIN" }, JWT_SECRET, {
        expiresIn: "1d",
      });
      return res.status(200).json({
        message: "Admin logged in successfully",
        token,
        user: { role: "ADMIN", name: "Librarian Admin", email },
      });
    }

    // 2. STUDENT CHECK
    // If not admin, search for a student with this email
    const student = await prisma.student.findUnique({
      where: { email },
    });

    if (!student) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // 3. VERIFY PASSWORD
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // 4. GENERATE STUDENT TOKEN
    const token = jwt.sign(
      { id: student.id, role: "STUDENT", roll_no: student.roll_no },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.status(200).json({
      message: "Student logged in successfully",
      token,
      user: {
        id: student.id,
        role: "STUDENT",
        name: student.name,
        email: student.email,
        roll_no: student.roll_no,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "An error occurred during login." });
  }
};

import { prisma } from "../lib/prisma.ts";
import bcrypt from "bcryptjs";

// Reusable projection so hashed passwords are never leaked in API responses
const studentSafeSelect = {
  id: true,
  roll_no: true,
  name: true,
  email: true,
  dept: true,
};

export const addStudent = async (req, res) => {
  try {
    const { roll_no, name, email, dept, password } = req.body ?? {};
    const parsedRollNo = parseInt(roll_no, 10);

    if (
      Number.isNaN(parsedRollNo) ||
      !name?.trim() ||
      !email?.trim() ||
      !dept?.trim() ||
      !password
    ) {
      return res.status(400).json({
        error:
          "Roll number, name, email, department, and password are required.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = await prisma.student.create({
      data: {
        roll_no: parsedRollNo,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        dept: dept.trim(),
        password: hashedPassword,
      },
      select: studentSafeSelect,
    });

    res
      .status(201)
      .json({ message: "Student created successfully!", student: newStudent });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "A student with this roll number or email already exists.",
      });
    }
    console.error("Error creating student:", error);
    res.status(500).json({ error: "Failed to create student." });
  }
};

export const getStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      orderBy: { roll_no: "asc" },
      select: studentSafeSelect,
    });
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the students." });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const parsedId = parseInt(req.params.id, 10);
    if (Number.isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid student id." });
    }

    const { name, email, dept, roll_no } = req.body ?? {};
    const updateData = {};

    if (name !== undefined) updateData.name = String(name).trim();
    if (email !== undefined)
      updateData.email = String(email).trim().toLowerCase();
    if (dept !== undefined) updateData.dept = String(dept).trim();

    if (roll_no !== undefined && roll_no !== "") {
      const parsedRollNo = parseInt(roll_no, 10);
      if (Number.isNaN(parsedRollNo)) {
        return res.status(400).json({ error: "Invalid roll_no value." });
      }
      updateData.roll_no = parsedRollNo;
    }

    const updatedStudent = await prisma.student.update({
      where: { id: parsedId },
      data: updateData,
      select: studentSafeSelect,
    });

    res
      .status(200)
      .json({ message: "Student updated", student: updatedStudent });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Student not found." });
    }
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "A student with this roll number or email already exists.",
      });
    }
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Failed to update student." });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const parsedId = parseInt(req.params.id, 10);
    if (Number.isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid student id." });
    }

    await prisma.student.delete({ where: { id: parsedId } });
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Student not found." });
    }
    if (error.code === "P2003") {
      return res
        .status(400)
        .json({ error: "Cannot delete student with existing borrow records." });
    }
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Failed to delete student." });
  }
};

import { prisma } from "../lib/prisma.ts";

export const getBorrowRecords = async (req, res) => {
  try {
    const { studentId, status } = req.query;
    const filterConditions = {};

    if (studentId) {
      const parsedStudentId = parseInt(studentId, 10);
      if (Number.isNaN(parsedStudentId)) {
        return res.status(400).json({ error: "Invalid studentId filter." });
      }
      filterConditions.studentId = parsedStudentId;
    }

    if (status) {
      filterConditions.status = String(status).toUpperCase();
    }

    const borrowRecords = await prisma.borrowRecord.findMany({
      where: filterConditions,
      orderBy: { id: "desc" },
      include: {
        student: {
          select: {
            id: true,
            roll_no: true,
            name: true,
            email: true,
            dept: true,
          },
        },
        book: true,
      },
    });

    res
      .status(200)
      .json({ totalFound: borrowRecords.length, records: borrowRecords });
  } catch (error) {
    console.error("Error fetching borrow records:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the borrow records." });
  }
};

export const borrowBook = async (req, res) => {
  try {
    const parsedStudentId = parseInt(req.body?.studentId, 10);
    const parsedBookId = parseInt(req.body?.bookId, 10);

    if (Number.isNaN(parsedStudentId) || Number.isNaN(parsedBookId)) {
      return res
        .status(400)
        .json({ error: "Valid studentId and bookId are required." });
    }

    const [student, book] = await Promise.all([
      prisma.student.findUnique({ where: { id: parsedStudentId } }),
      prisma.book.findUnique({ where: { id: parsedBookId } }),
    ]);

    if (!student) {
      return res.status(404).json({ error: "Student not found." });
    }

    if (!book || book.availableCopies <= 0) {
      return res
        .status(400)
        .json({ error: "Out of stock! No copies available right now." });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const [record] = await prisma.$transaction([
      prisma.borrowRecord.create({
        data: {
          studentId: parsedStudentId,
          bookId: parsedBookId,
          dueDate,
        },
      }),
      prisma.book.update({
        where: { id: parsedBookId },
        data: { availableCopies: { decrement: 1 } },
      }),
    ]);

    res.status(201).json({ message: "Book borrowed successfully!", record });
  } catch (error) {
    console.error("Error borrowing book:", error);
    res.status(500).json({ error: "Failed to borrow book." });
  }
};

export const returnBook = async (req, res) => {
  try {
    const parsedRecordId = parseInt(req.body?.recordId, 10);

    if (Number.isNaN(parsedRecordId)) {
      return res.status(400).json({ error: "Valid recordId is required." });
    }

    const record = await prisma.borrowRecord.findUnique({
      where: { id: parsedRecordId },
    });

    if (!record || record.status === "RETURNED") {
      return res
        .status(400)
        .json({ error: "Invalid record or book already returned." });
    }

    const [updatedRecord] = await prisma.$transaction([
      prisma.borrowRecord.update({
        where: { id: parsedRecordId },
        data: { status: "RETURNED", returnDate: new Date() },
      }),
      prisma.book.update({
        where: { id: record.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
    ]);

    res
      .status(200)
      .json({ message: "Book returned successfully!", record: updatedRecord });
  } catch (error) {
    console.error("Error returning book:", error);
    res.status(500).json({ error: "Failed to process return." });
  }
};

export const deleteBorrowRecord = async (req, res) => {
  try {
    const parsedId = parseInt(req.params.id, 10);

    if (Number.isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid record id." });
    }

    const record = await prisma.borrowRecord.findUnique({
      where: { id: parsedId },
    });

    if (!record) {
      return res.status(404).json({ error: "Record not found." });
    }

    if (record.status !== "RETURNED") {
      await prisma.$transaction([
        prisma.borrowRecord.delete({ where: { id: parsedId } }),
        prisma.book.update({
          where: { id: record.bookId },
          data: { availableCopies: { increment: 1 } },
        }),
      ]);
    } else {
      await prisma.borrowRecord.delete({ where: { id: parsedId } });
    }

    res.status(200).json({ message: "Borrow record deleted permanently" });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Failed to delete record." });
  }
};

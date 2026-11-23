import { prisma } from "../lib/prisma.ts";

// CREATE: Add a new book
export const addBook = async (req, res) => {
  try {
    const { title, author, price, totalQuantity } = req.body ?? {};
    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(totalQuantity, 10);

    if (!title?.trim() || !author?.trim()) {
      return res.status(400).json({ error: "Title and author are required." });
    }

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res
        .status(400)
        .json({ error: "Price must be a valid non-negative number." });
    }

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      return res
        .status(400)
        .json({ error: "Total quantity must be at least 1." });
    }

    const newBook = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        price: parsedPrice,
        totalQuantity: parsedQuantity,
        availableCopies: parsedQuantity,
      },
    });

    res.status(201).json({ message: "Book added successfully", book: newBook });
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ error: "Failed to add book." });
  }
};

// READ: View all existing books
export const getBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { id: "desc" },
    });
    res.status(200).json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Failed to fetch books." });
  }
};

// UPDATE: Update book details
export const updateBook = async (req, res) => {
  try {
    const parsedId = parseInt(req.params.id, 10);
    if (Number.isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid book id." });
    }

    const { title, author, price, totalQuantity, availableCopies } =
      req.body ?? {};

    const updateData = {};

    if (title !== undefined) updateData.title = String(title).trim();
    if (author !== undefined) updateData.author = String(author).trim();

    if (price !== undefined && price !== "") {
      const parsedPrice = parseFloat(price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ error: "Invalid price value." });
      }
      updateData.price = parsedPrice;
    }

    if (totalQuantity !== undefined && totalQuantity !== "") {
      const parsedTotal = parseInt(totalQuantity, 10);
      if (Number.isNaN(parsedTotal) || parsedTotal < 1) {
        return res.status(400).json({ error: "Invalid totalQuantity value." });
      }
      updateData.totalQuantity = parsedTotal;
    }

    if (availableCopies !== undefined && availableCopies !== "") {
      const parsedAvailable = parseInt(availableCopies, 10);
      if (Number.isNaN(parsedAvailable) || parsedAvailable < 0) {
        return res
          .status(400)
          .json({ error: "Invalid availableCopies value." });
      }
      updateData.availableCopies = parsedAvailable;
    }

    const updatedBook = await prisma.book.update({
      where: { id: parsedId },
      data: updateData,
    });

    res.status(200).json({ message: "Book updated", book: updatedBook });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Book not found." });
    }
    console.error("Error updating book:", error);
    res.status(500).json({ error: "Failed to update book." });
  }
};

// DELETE: Remove a book
export const deleteBook = async (req, res) => {
  try {
    const parsedId = parseInt(req.params.id, 10);
    if (Number.isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid book id." });
    }

    await prisma.book.delete({
      where: { id: parsedId },
    });

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Book not found." });
    }
    if (error.code === "P2003") {
      return res
        .status(400)
        .json({ error: "Cannot delete a book that has a borrow history." });
    }
    console.error("Error deleting book:", error);
    res.status(500).json({ error: "Failed to delete book." });
  }
};

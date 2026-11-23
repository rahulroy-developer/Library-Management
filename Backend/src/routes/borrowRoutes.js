import express from "express";
import {
  getBorrowRecords,
  borrowBook,
  returnBook,
  deleteBorrowRecord,
} from "../controllers/borrowController.js";

const router = express.Router();

router.get("/", getBorrowRecords);
router.post("/", borrowBook);
router.post("/return", returnBook);
router.delete("/:id", deleteBorrowRecord);

export default router;

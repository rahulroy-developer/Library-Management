import express from "express";
import cors from "cors"; // You must install this via npm

// Import Routers
import bookRoutes from "../Backend/src/routes/bookRoutes.js";
import studentRoutes from "../Backend/src/routes/studentRoutes.js";
import borrowRoutes from "../Backend/src/routes/borrowRoutes.js";
import { login } from "../Backend/src/controllers/authController.js";
// Import Cron Jobs so they start running
import "../Backend/src/jobs/cronJobs.js";

const app = express();
const port = process.env.PORT || 3000;

// 1. Middleware (MUST GO FIRST)
app.use(cors());
app.use(express.json()); // This must happen before any routes!

// 2. Mount Routes (NOW IT WILL WORK)
app.post("/api/login", login);
app.use("/books", bookRoutes);
app.use("/students", studentRoutes);
app.use("/borrow", borrowRoutes);

// 3. Server Initialization
app.listen(port, () => {
  console.log(`Server is running beautifully on http://localhost:${port}`);
});

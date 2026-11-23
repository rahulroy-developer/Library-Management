import cron from "node-cron";
import { prisma } from "../lib/prisma.ts";

// Runs every day at 00:00 (Midnight)
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily overdue book check...");

  try {
    const overdueRecords = await prisma.borrowRecord.findMany({
      where: {
        status: { not: "RETURNED" },
        dueDate: { lt: new Date() },
      },
      include: { student: true, book: true },
    });

    console.log(`Found ${overdueRecords.length} overdue books.`);

    for (const record of overdueRecords) {
      const today = new Date();
      const daysLate = Math.floor(
        (today - record.dueDate) / (1000 * 60 * 60 * 24),
      );
      const calculatedFine = daysLate * 10;

      await prisma.borrowRecord.update({
        where: { id: record.id },
        data: {
          status: "OVERDUE",
          fineAmount: calculatedFine,
        },
      });

      console.log(
        `Late Notice: ${record.student.email} owes ${calculatedFine} rupees for ${record.book.title}`,
      );
    }
  } catch (error) {
    console.error("Error running overdue cron job:", error);
  }
});

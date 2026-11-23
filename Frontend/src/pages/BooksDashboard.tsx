import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  User,
  IndianRupee,
  Search,
  Plus,
  ArrowRightLeft,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Library,
  Code2,
  RefreshCw,
  UserPlus,
  AlertCircle,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API_BASE = "http://localhost:3000";

interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  totalQuantity: number;
  availableCopies: number;
}

interface Student {
  id: number;
  roll_no: number;
  name: string;
  email: string;
  dept: string;
}

interface BorrowRecord {
  id: number;
  studentId: number;
  bookId: number;
  status: "BORROWED" | "RETURNED" | "OVERDUE" | "ACTIVE";
  dueDate: string;
  fineAmount?: number;
  student?: Student;
  book?: Book;
}

interface FeedbackMessage {
  type: "success" | "error";
  text: string;
}

export default function BooksDashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);

  const [activeTab, setActiveTab] = useState("books");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  // Add Book modal state
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [submittingBook, setSubmittingBook] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    price: "",
    totalQuantity: "",
  });

  // Add Student modal state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [submittingStudent, setSubmittingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    roll_no: "",
    name: "",
    dept: "",
    email: "",
    password: "",
  });

  // Borrow Book modal state
  const [borrowTarget, setBorrowTarget] = useState<Book | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [submittingBorrow, setSubmittingBorrow] = useState(false);
  const [returningId, setReturningId] = useState<number | null>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
  };

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [booksRes, studentsRes, borrowRes] = await Promise.all([
        fetch(`${API_BASE}/books`),
        fetch(`${API_BASE}/students`),
        fetch(`${API_BASE}/borrow`),
      ]);

      if (!booksRes.ok || !studentsRes.ok || !borrowRes.ok) {
        throw new Error("Backend returned an error status.");
      }

      const booksData = await booksRes.json();
      const studentsData = await studentsRes.json();
      const borrowData = await borrowRes.json();

      setBooks(Array.isArray(booksData) ? booksData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setRecords(
        Array.isArray(borrowData)
          ? borrowData
          : Array.isArray(borrowData?.records)
            ? borrowData.records
            : [],
      );
      setApiOnline(true);
    } catch (err) {
      console.error("Error fetching data:", err);
      setApiOnline(false);
      showFeedback(
        "error",
        "Could not connect to backend API at http://localhost:3000.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBook(true);
    try {
      const res = await fetch(`${API_BASE}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newBook.title.trim(),
          author: newBook.author.trim(),
          price: Number(newBook.price),
          totalQuantity: Number(newBook.totalQuantity),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to add book.");
      }

      setIsAddBookOpen(false);
      setNewBook({ title: "", author: "", price: "", totalQuantity: "" });
      showFeedback("success", `"${newBook.title.trim()}" added to catalog.`);
      await fetchData();
    } catch (error) {
      showFeedback(
        "error",
        error instanceof Error ? error.message : "Failed to add book.",
      );
    } finally {
      setSubmittingBook(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStudent(true);
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roll_no: Number(newStudent.roll_no),
          name: newStudent.name.trim(),
          dept: newStudent.dept.trim(),
          email: newStudent.email.trim(),
          password: newStudent.password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to enroll student.");
      }

      setIsAddStudentOpen(false);
      setNewStudent({
        roll_no: "",
        name: "",
        dept: "",
        email: "",
        password: "",
      });
      showFeedback("success", `Enrolled ${newStudent.name.trim()}.`);
      await fetchData();
    } catch (error) {
      showFeedback(
        "error",
        error instanceof Error ? error.message : "Failed to enroll student.",
      );
    } finally {
      setSubmittingStudent(false);
    }
  };

  const handleBorrowBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowTarget || !selectedStudentId) return;

    setSubmittingBorrow(true);
    try {
      const res = await fetch(`${API_BASE}/borrow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: Number(selectedStudentId),
          bookId: borrowTarget.id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue book.");
      }

      showFeedback("success", `Issued "${borrowTarget.title}" successfully.`);
      setBorrowTarget(null);
      setSelectedStudentId("");
      await fetchData();
    } catch (error) {
      showFeedback(
        "error",
        error instanceof Error ? error.message : "Failed to issue book.",
      );
    } finally {
      setSubmittingBorrow(false);
    }
  };

  const handleReturnBook = async (recordId: number) => {
    setReturningId(recordId);
    try {
      let res = await fetch(`${API_BASE}/borrow/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId }),
      });

      // Fallback if backend exposes /return at root
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/return`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordId }),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to return book.");
      }

      showFeedback("success", "Book returned and stock updated.");
      await fetchData();
    } catch (error) {
      showFeedback(
        "error",
        error instanceof Error ? error.message : "Failed to return book.",
      );
    } finally {
      setReturningId(null);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(normalizedQuery) ||
      b.author.toLowerCase().includes(normalizedQuery),
  );

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(normalizedQuery) ||
      s.dept.toLowerCase().includes(normalizedQuery) ||
      s.email.toLowerCase().includes(normalizedQuery) ||
      String(s.roll_no).includes(normalizedQuery),
  );

  const filteredRecords = records.filter((r) => {
    const studentName = r.student?.name?.toLowerCase() ?? "";
    const bookTitle = r.book?.title?.toLowerCase() ?? "";
    const status = r.status?.toLowerCase() ?? "";
    return (
      studentName.includes(normalizedQuery) ||
      bookTitle.includes(normalizedQuery) ||
      status.includes(normalizedQuery)
    );
  });

  const totalCopies = books.reduce(
    (acc, b) => acc + Number(b.totalQuantity || 0),
    0,
  );
  const availableCopies = books.reduce(
    (acc, b) => acc + Number(b.availableCopies || 0),
    0,
  );
  const activeBorrows = records.filter(
    (r) => String(r.status).toUpperCase() !== "RETURNED",
  ).length;

  const searchPlaceholder =
    activeTab === "books"
      ? "Search by title or author..."
      : activeTab === "students"
        ? "Search by name, roll no, or dept..."
        : "Search by student, book, or status...";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020817] text-white">
        <div className="flex flex-col items-center gap-4">
          <Library className="h-12 w-12 text-indigo-500 animate-bounce" />
          <p className="text-base font-medium text-slate-400">
            Loading Library...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020817] text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* 1. STICKY NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/70 bg-[#020817]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600/20 p-2 rounded-xl border border-indigo-500/30">
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-100">
              Library<span className="text-indigo-400"></span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="border-slate-800 bg-slate-900/70 text-slate-300 hover:bg-slate-800 hover:text-white gap-2"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <div
              title="Rahul Roy — Admin"
              className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold shadow-lg border border-indigo-400/30"
            >
              RR
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Inline Toast Notification */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-current opacity-70 hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Management Portal
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Real-time inventory and circulation record manager.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Add Student Modal */}
            <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-100 gap-2"
                >
                  <UserPlus className="h-4 w-4" /> Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Enroll New Student</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Register a student account for borrowing books.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddStudent} className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Roll No (e.g. 101)"
                      value={newStudent.roll_no}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          roll_no: e.target.value,
                        })
                      }
                      className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                      required
                    />
                    <Input
                      placeholder="Department (e.g. CSE)"
                      value={newStudent.dept}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, dept: e.target.value })
                      }
                      className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>
                  <Input
                    placeholder="Full Name"
                    value={newStudent.name}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, name: e.target.value })
                    }
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={newStudent.email}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, email: e.target.value })
                    }
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Account Password"
                    value={newStudent.password}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, password: e.target.value })
                    }
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={submittingStudent}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    {submittingStudent ? "Saving..." : "Enroll Student"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Add Book Modal */}
            <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 gap-2">
                  <Plus className="h-4 w-4" /> Add New Book
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Book</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Register a new title into the library database.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddBook} className="space-y-4 mt-2">
                  <Input
                    placeholder="Book Title"
                    value={newBook.title}
                    onChange={(e) =>
                      setNewBook({ ...newBook, title: e.target.value })
                    }
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                  <Input
                    placeholder="Author"
                    value={newBook.author}
                    onChange={(e) =>
                      setNewBook({ ...newBook, author: e.target.value })
                    }
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price (₹)"
                      value={newBook.price}
                      onChange={(e) =>
                        setNewBook({ ...newBook, price: e.target.value })
                      }
                      className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                      required
                    />
                    <Input
                      type="number"
                      min="1"
                      placeholder="Total Copies"
                      value={newBook.totalQuantity}
                      onChange={(e) =>
                        setNewBook({
                          ...newBook,
                          totalQuantity: e.target.value,
                        })
                      }
                      className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submittingBook}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    {submittingBook ? "Saving..." : "Save Book to Inventory"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/60 border-slate-800/80 text-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Total Titles
              </CardTitle>
              <BookOpen className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="text-3xl font-bold">{books.length}</div>
              <p className="text-xs text-slate-400 mt-1.5">
                {totalCopies} physical copies
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800/80 text-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Available Stock
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="text-3xl font-bold text-emerald-400">
                {availableCopies}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Ready to be issued
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800/80 text-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Active Borrows
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="text-3xl font-bold text-amber-400">
                {activeBorrows}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Currently in circulation
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800/80 text-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Enrolled Students
              </CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="text-3xl font-bold">{students.length}</div>
              <p className="text-xs text-slate-400 mt-1.5">
                Registered members
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Navigation Area — !block prevents horizontal flex squeeze */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val);
            setSearchQuery("");
          }}
          className="w-full !block"
        >
          {/* Toolbar Row */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6 w-full">
            <TabsList className="bg-slate-900/90 border border-slate-800 p-1 h-auto inline-flex w-fit">
              <TabsTrigger
                value="books"
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md transition-colors"
              >
                Books Catalog
              </TabsTrigger>
              <TabsTrigger
                value="students"
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md transition-colors"
              >
                Students
              </TabsTrigger>
              <TabsTrigger
                value="borrow"
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md transition-colors"
              >
                Circulation & Borrows
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-900/70 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          {/* BOOKS TAB */}
          <TabsContent
            value="books"
            className="mt-0 w-full focus-visible:outline-none"
          >
            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 w-full">
                <AnimatePresence>
                  {filteredBooks.map((book) => {
                    const total = Number(book.totalQuantity || 0);
                    const avail = Number(book.availableCopies || 0);
                    const stockPercentage =
                      total > 0
                        ? Math.min(100, Math.round((avail / total) * 100))
                        : 0;

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        whileHover={{ y: -4 }}
                        key={book.id}
                        className="w-full"
                      >
                        <Card className="bg-slate-900/60 border-slate-800/80 text-white shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between h-full">
                          <CardHeader className="p-5 pb-3">
                            <div className="flex justify-between items-start gap-2">
                              <CardTitle className="text-base font-bold leading-snug text-white line-clamp-2">
                                {book.title}
                              </CardTitle>
                              <Badge
                                variant={avail > 0 ? "outline" : "destructive"}
                                className={
                                  avail > 0
                                    ? "shrink-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                    : "shrink-0"
                                }
                              >
                                {avail > 0 ? "In Stock" : "Out"}
                              </Badge>
                            </div>
                            <CardDescription className="text-slate-400 flex items-center gap-1.5 pt-1.5 text-xs">
                              <User className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{book.author}</span>
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="px-5 pb-4 space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                              <span className="text-slate-400 text-xs">
                                Price
                              </span>
                              <span className="text-base font-semibold text-slate-100 flex items-center">
                                <IndianRupee className="h-3.5 w-3.5 mr-0.5 text-slate-400" />
                                {book.price}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-xs font-medium">
                                <span className="text-slate-400">
                                  Availability
                                </span>
                                <span className="font-mono text-slate-200">
                                  {avail}{" "}
                                  <span className="text-slate-500">
                                    / {total}
                                  </span>
                                </span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                <div
                                  className={`h-full transition-all duration-500 rounded-full ${
                                    stockPercentage > 50
                                      ? "bg-emerald-500"
                                      : stockPercentage > 20
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${stockPercentage}%` }}
                                />
                              </div>
                            </div>
                          </CardContent>

                          <CardFooter className="p-5 pt-0">
                            <Button
                              disabled={avail === 0}
                              onClick={() => {
                                setBorrowTarget(book);
                                setSelectedStudentId(
                                  students[0] ? String(students[0].id) : "",
                                );
                              }}
                              variant="secondary"
                              className="w-full bg-slate-800/90 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-100 hover:text-white transition-all group disabled:opacity-40"
                            >
                              <ArrowRightLeft className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                              Borrow Book
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 w-full">
                <Library className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                <h3 className="text-base font-semibold text-slate-300">
                  No books found
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Adjust your search or add a new book to the inventory.
                </p>
              </div>
            )}
          </TabsContent>

          {/* STUDENTS TAB */}
          <TabsContent
            value="students"
            className="mt-0 w-full focus-visible:outline-none"
          >
            <Card className="bg-slate-900/60 border-slate-800/80 text-white w-full overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-950/60">
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-semibold h-12 px-6">
                        Roll No
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold px-6">
                        Name
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold px-6">
                        Department
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold px-6">
                        Email
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow className="border-slate-800">
                        <TableCell
                          colSpan={4}
                          className="text-center py-12 text-slate-500"
                        >
                          No matching students found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow
                          key={student.id}
                          className="border-slate-800 hover:bg-slate-800/40 transition-colors"
                        >
                          <TableCell className="font-mono text-indigo-400 px-6 py-4">
                            {student.roll_no}
                          </TableCell>
                          <TableCell className="font-medium text-slate-100 px-6 py-4">
                            {student.name}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge
                              variant="outline"
                              className="border-slate-700 text-slate-300 bg-slate-900"
                            >
                              {student.dept}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400 px-6 py-4">
                            {student.email}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* CIRCULATION & BORROWS TAB */}
          <TabsContent
            value="borrow"
            className="mt-0 w-full focus-visible:outline-none"
          >
            <Card className="bg-slate-900/60 border-slate-800/80 text-white w-full overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-950/60">
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-semibold h-12 px-6">
                        Student
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold px-6">
                        Book Title
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold px-6">
                        Status
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold px-6">
                        Due Date
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold text-right px-6">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length === 0 ? (
                      <TableRow className="border-slate-800">
                        <TableCell
                          colSpan={5}
                          className="text-center py-12 text-slate-500"
                        >
                          No circulation records yet. Issue a book from the
                          Books Catalog tab to see it here.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecords.map((record) => {
                        const statusUpper = String(record.status).toUpperCase();
                        const isReturned = statusUpper === "RETURNED";
                        const formattedDate = record.dueDate
                          ? new Date(record.dueDate).toLocaleDateString()
                          : "—";

                        return (
                          <TableRow
                            key={record.id}
                            className="border-slate-800 hover:bg-slate-800/40 transition-colors"
                          >
                            <TableCell className="font-medium text-slate-100 px-6 py-4">
                              {record.student?.name ||
                                `Student #${record.studentId}`}
                            </TableCell>
                            <TableCell className="text-slate-300 px-6 py-4">
                              {record.book?.title || `Book #${record.bookId}`}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <Badge
                                variant="outline"
                                className={
                                  isReturned
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : statusUpper === "OVERDUE"
                                      ? "bg-red-500/10 text-red-400 border-red-500/30"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                }
                              >
                                {statusUpper}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-400 text-sm px-6 py-4">
                              {formattedDate}
                            </TableCell>
                            <TableCell className="text-right px-6 py-4">
                              {!isReturned ? (
                                <Button
                                  size="sm"
                                  disabled={returningId === record.id}
                                  onClick={() => handleReturnBook(record.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                                >
                                  {returningId === record.id
                                    ? "Returning..."
                                    : "Return Book"}
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-500">
                                  Completed
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Borrow Book Modal */}
        <Dialog
          open={Boolean(borrowTarget)}
          onOpenChange={(open) => {
            if (!open) setBorrowTarget(null);
          }}
        >
          <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Issue Book</DialogTitle>
              <DialogDescription className="text-slate-400">
                Select an enrolled student to borrow{" "}
                <span className="text-slate-200 font-medium">
                  {borrowTarget?.title}
                </span>
                .
              </DialogDescription>
            </DialogHeader>

            {students.length === 0 ? (
              <div className="space-y-4 mt-2">
                <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  No enrolled students found. Enroll a student first before
                  issuing a book.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    setBorrowTarget(null);
                    setIsAddStudentOpen(true);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Enroll a Student
                </Button>
              </div>
            ) : (
              <form onSubmit={handleBorrowBook} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <label
                    htmlFor="borrow-student-select"
                    className="text-xs font-medium text-slate-400"
                  >
                    Student
                  </label>
                  <select
                    id="borrow-student-select"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                    className="w-full h-10 rounded-md bg-slate-950 border border-slate-700 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>
                      Choose a student...
                    </option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Roll #{s.roll_no} — {s.dept})
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={submittingBorrow || !selectedStudentId}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {submittingBorrow ? "Issuing..." : "Confirm Borrow"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>

      {/* 3. FOOTER */}
      <footer className="w-full border-t border-slate-800/70 bg-[#020817] mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Library. Built by Rahul Roy.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-200 text-sm inline-flex items-center gap-2 transition-colors"
            >
              <Code2 className="h-4 w-4" /> Source Code
            </a>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 text-sm flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {apiOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    apiOnline ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
              </span>
              {apiOnline ? "API Connected" : "API Offline"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

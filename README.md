# Library Management System

A full-stack web application built to manage library books, enrolled students, and book borrowing/returning records with real-time stock tracking.

## Features

- **Dashboard Overview:** Live summary of total titles, available stock, active borrows, and enrolled students.
- **Book Catalog Management:** Add new books, search by title or author, and monitor real-time copy availability.
- **Student Management:** Enroll students with securely hashed passwords (`bcryptjs`) and search student records.
- **Borrow & Return Workflow:** Issue books to enrolled students with automatic 15-day due dates and process returns. Uses database transactions so inventory counts stay accurate.
- **Authentication API:** JWT-based login support for Admin and Student roles.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite, Framer Motion, Lucide Icons
- **Backend:** Node.js, Express.js (ES Modules)
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Security:** `bcryptjs` (password hashing), `jsonwebtoken` (JWT auth)

## Project Structure

```text
Library/
├── Backend/
│   ├── prisma/              # Prisma schema & database config
│   ├── src/
│   │   ├── controllers/     # Route logic (books, students, borrow, auth)
│   │   ├── routes/          # Express route definitions
│   │   └── lib/             # Prisma client setup
│   └── index.js             # Express server entry point
└── Frontend/
    ├── src/
    │   ├── components/      # Reusable UI components
    │   ├── pages/           # BooksDashboard UI
    │   └── App.tsx
    └── package.json
```

## API Endpoints

### Books
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/books` | Get all books |
| `POST` | `/books` | Add a new book |
| `PUT` | `/books/:id` | Update book details |
| `DELETE` | `/books/:id` | Delete a book |

### Students
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/students` | Get all enrolled students |
| `POST` | `/students` | Enroll a new student |
| `PUT` | `/students/:id` | Update student details |
| `DELETE` | `/students/:id` | Delete a student |

### Circulation (Borrow & Return)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/borrow` | Get all borrow records (supports `?studentId=` and `?status=` filters) |
| `POST` | `/borrow` | Issue a book to a student (decrements available stock) |
| `POST` | `/borrow/return` | Mark a borrowed book as returned (increments available stock) |
| `DELETE` | `/borrow/:id` | Delete a borrow record |

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/login` | Authenticate user and return a JWT |

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL database

### 1. Setup the Backend

```bash
cd Backend
npm install
```

Create a `.env` file inside the `Backend` folder:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/library_db"
JWT_SECRET="your_secret_key"
PORT=3000
```

Push the Prisma schema to your database and start the server:

```bash
npx prisma db push
npm run dev
```

*(The backend runs on `http://localhost:3000`.)*

### 2. Setup the Frontend

```bash
cd Frontend
npm install
npm run dev
```

*(The frontend runs on `http://localhost:5173`.)*

## Author

Built by **Rahul Roy**.

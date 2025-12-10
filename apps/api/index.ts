import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import leadsRouter from "./routes/leads";
import clientsRouter from "./routes/clients";
import dealsRouter from "./routes/deals";
import foldersRouter from "./routes/folders";
import documentsRouter from "./routes/documents";
import usersRouter from "./routes/users";

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3000", // Next.js frontend
  credentials: true, // Allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRouter);
app.use("/leads", leadsRouter);
app.use("/clients", clientsRouter);
app.use("/deals", dealsRouter);
app.use("/folders", foldersRouter);
app.use("/documents", documentsRouter);
app.use("/users", usersRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
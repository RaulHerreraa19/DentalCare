const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");

const globalErrorHandler = require("./middlewares/error.middleware");
const authRouter = require("./modules/auth/auth.router");
const superadminRouter = require("./modules/superadmin/superadmin.router");
const organizationsRouter = require("./modules/organizations/organizations.router");
const clinicsRouter = require("./modules/clinics/clinics.router");
const usersRouter = require("./modules/users/users.router");
const servicesRouter = require("./modules/services/services.router");
const dashboardRouter = require("./modules/dashboard/dashboard.router");
const patientsRouter = require("./modules/patients/patients.router");
const appointmentsRouter = require("./modules/appointments/appointments.router");
const billingRouter = require("./modules/billing/billing.router");
const medicalRecordsRouter = require("./modules/medical-records/medical-records.router");
const prescriptionsRouter = require("./modules/prescriptions/prescriptions.router");
const uploadsRouter = require("./modules/uploads/uploads.router");
const remindersRouter = require("./modules/reminders/reminders.router");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.VITE_API_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/superadmin", superadminRouter);
app.use("/api/v1/organizations", organizationsRouter);
app.use("/api/v1/clinics", clinicsRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/services", servicesRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/patients", patientsRouter);
app.use("/api/v1/appointments", appointmentsRouter);
app.use("/api/v1/billing", billingRouter);
app.use("/api/v1/medical-records", medicalRecordsRouter);
app.use("/api/v1/prescriptions", prescriptionsRouter);
app.use("/api/v1/uploads", uploadsRouter);
app.use("/api/v1/reminders", remindersRouter);

// Base route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: process.env.NODE_ENV });
});

// Unknown routes
app.use((req, res, next) => {
  const AppError = require("./utils/AppError");
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;

import express from "express";
import cors from "cors";
import "dotenv/config";

// Cron Jobs
import "./config/cron.config.js";

// Configs
import { connectDB } from "./config/db.config.js";
import { getLocalIP } from "./config/ip.config.js";
import corsOptions from "./config/cors.config.js";

// Import Routes
import servicePricesRoute from "./Quotation/ServicePrices/ServicePrice.routes.js";
import quotationRoutes from "./Quotation/Quote/routes/Quote.routes.js";
import userRoutes from "./StaffCRM/Users/user.routes.js";
import attendenceRoutes from "./StaffCRM/Attendance/attendance.routes.js";
import reportRoutes from "./StaffCRM/Report/report.routes.js";
import holidayRoutes from "./StaffCRM/Holidays/holiday.routes.js";
import taskRoutes from "./StaffCRM/Tasks/task.routes.js";
import leaveRoutes from "./StaffCRM/Leaves/leave.routes.js";
import todoRoutes from "./StaffCRM/Todo/todo.routes.js";
import LeadsRoutes from "./StaffCRM/Leads/Lead.routes.js";
import ClientRoutes from "./StaffCRM/Clients/Client.routes.js";
import whatsappRoutes from "./Whatsapp/whatsapp.route.js";

import { globalErrorHandler } from "./StaffCRM/middleware/error.middleware.js";
import influencerRoutes from "./StaffCRM/Influencers/Influencers.routes.js";
import ugcCreatorRoutes from "./StaffCRM/UGCCreators/UGCCreators.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const VERSION = process.env.VERSION || "v1.0";

// DB
connectDB();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// Routes
app.get(`/api/${VERSION}`, (req, res) => {
  res.send("API Working");
});

// Health Check Route
app.get("/ping", (req, res) => res.status(200).send("✅ App is awake."));

// Service Pricing Routes
app.use(`/api/${VERSION}/service-prices`, servicePricesRoute);

//Quotation Routes
app.use(`/api/${VERSION}/quotation`, quotationRoutes);

// Whatsapp Routes
app.use(`/api/${VERSION}/whatsapp`, whatsappRoutes);

// User Routes
app.use(`/api/${VERSION}/users`, userRoutes);

// Attendence Routes
app.use(`/api/${VERSION}/attendance`, attendenceRoutes);

// Holiday Routes
app.use(`/api/${VERSION}/holiday`, holidayRoutes);

//Leave Routes
app.use(`/api/${VERSION}/leave`, leaveRoutes);

// Report Routes
app.use(`/api/${VERSION}/reports`, reportRoutes);

// Task Routes
app.use(`/api/${VERSION}/tasks`, taskRoutes);

// To-do Routes
app.use(`/api/${VERSION}/todo`, todoRoutes);

// Client Routes
app.use(`/api/${VERSION}/clients`, ClientRoutes);

// Lead Routes
app.use(`/api/${VERSION}/leads`, LeadsRoutes);

// Influencer Routes
app.use(`/api/${VERSION}/influencers`, influencerRoutes);

// UGCCreator Routes
app.use(`/api/${VERSION}/ugccreators`, ugcCreatorRoutes);

app.use(globalErrorHandler);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  const localIP = getLocalIP();
  console.log(
    `Server running locally ➜ http://localhost:${PORT}/api/${VERSION}`,
  );
  console.log(
    `Server running on LAN ➜ http://${localIP}:${PORT}/api/${VERSION}`,
  );
});

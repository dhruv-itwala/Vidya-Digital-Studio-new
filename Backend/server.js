import express from "express";
import cors from "cors";
import "dotenv/config";

// Cron Jobs
import "./config/cron.config.js";

// Configs
import { connectDB } from "./config/db.config.js";
import corsOptions from "./config/cors.config.js";
import { getLocalIP } from "./config/ip.config.js";

// Middleware
import bodyParser from "body-parser";

// Import Routes
import servicePricesRoute from "./ServicePrices/routes/ServicePrice.routes.js";
import quotationRoutes from "./Quote/routes/Quote.routes.js";
import utilsRoutes from "./utils/Utils.routes.js";
import userRoutes from "./Users/user.routes.js";
import attendenceRoutes from "./Attendance/attendance.routes.js";
import reportRoutes from "./Report/report.routes.js";
import holidayRoutes from "./Holidays/holiday.routes.js";
import taskRoutes from "./Tasks/task.routes.js";
import leaveRoutes from "./Leaves/leave.routes.js";
import todoRoutes from "./Todo/todo.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const VERSION = process.env.VERSION || "v1.0";

// DB
connectDB();

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "15mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get(`/api/${VERSION}`, (req, res) => {
  res.send("API Working");
});

// Utils Routes
app.use("/api", utilsRoutes);

// Service Pricing Routes
app.use(`/api/${VERSION}/service-prices`, servicePricesRoute);

//Quotation Routes
app.use(`/api/${VERSION}/quotation`, quotationRoutes);

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

// Todo Routes
app.use(`/api/${VERSION}/todo`, todoRoutes);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  const localIP = getLocalIP();
  console.log(
    `Server running locally ➜ http://localhost:${PORT}/api/${VERSION}`
  );
  console.log(
    `Server running on LAN ➜ http://${localIP}:${PORT}/api/${VERSION}`
  );
});

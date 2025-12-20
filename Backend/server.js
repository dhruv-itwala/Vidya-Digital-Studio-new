import express from "express";
import cors from "cors";
import "dotenv/config";
// Configs
import { connectDB } from "./config/db.config.js";
import corsOptions from "./config/cors.config.js";
import { getLocalIP } from "./config/ip.config.js";

// Middleware
import bodyParser from "body-parser";

// Import Routes
import servicePricesRoute from "./ServicePrices/routes/ServicePrice.routes.js";
import quotationRoutes from "./Quote/routes/Quote.routes.js";
import utilsRoutes from "./utils/routes/Utils.routes.js";
import userRoutes from "./Users/routes/user.routes.js";
import seedRoutes from "./Users/routes/seed.routes.js";
import attendenceRoutes from "./Attendance/routes/attendance.routes.js";
import reportRoutes from "./Report/routes/report.routes.js";
import taskRoutes from "./Tasks/routes/task.routes.js";

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

// Seed Routes (Temporary)
app.use(`/api/${VERSION}/seed`, seedRoutes);

// Attendence Routes
app.use(`/api/${VERSION}/attendance`, attendenceRoutes);

// Report Routes
app.use(`/api/${VERSION}/reports`, reportRoutes);

// Task Routes
app.use(`/api/${VERSION}/tasks`, taskRoutes);

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

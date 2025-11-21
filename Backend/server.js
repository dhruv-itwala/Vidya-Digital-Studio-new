import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.config.js";
import corsOptions from "./config/cors.config.js";
import { getLocalIP } from "./config/ip.config.js";
import quotationRoutes from "./routes/Quote.routes.js";
import bodyParser from "body-parser";
import utilsRoutes from "./routes/Utils.routes.js";
import servicePricesRoute from "./routes/ServicePrice.routes.js";

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

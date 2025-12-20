// routes/quote.routes.js
import express from "express";
import {
  createQuote,
  getQuote,
  listQuotes,
  deleteQuote,
  testPdf,
} from "../controllers/Quote.controller.js";

const quotationRoutes = express.Router();

quotationRoutes.post("/pdf/generate", createQuote);
quotationRoutes.get("/:id", getQuote);
quotationRoutes.get("/", listQuotes);
quotationRoutes.delete("/:id", deleteQuote);
quotationRoutes.post("/pdf/test", testPdf);

export default quotationRoutes;

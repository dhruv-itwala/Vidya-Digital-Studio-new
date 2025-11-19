import dotenv from "dotenv";
dotenv.config();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
const allowAll = allowedOrigins.includes("*");

const corsOptions = {
  origin: function (origin, callback) {
    if (allowAll) {
      // If "*" in env, allow all origins
      callback(null, true);
    } else if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

export default corsOptions;

// Allow all
// ALLOWED_ORIGINS=*

// Specific domains only
// ALLOWED_ORIGINS=https://example.com,https://myapp.com

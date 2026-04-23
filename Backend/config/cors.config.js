const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // mobile apps / Postman

    const allowedDomain = "vidyadigitalstudio.com";

    try {
      const url = new URL(origin);
      const hostname = url.hostname;

      if (
        hostname === allowedDomain ||
        hostname.endsWith(`.${allowedDomain}`)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    } catch (err) {
      return callback(new Error("Invalid origin"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

export default corsOptions;

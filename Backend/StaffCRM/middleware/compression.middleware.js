// Backend/StaffCRM/middleware/compression.middleware.js
import zlib from "node:zlib";

/**
 * Native, zero-dependency streaming response compression middleware using Node.js zlib.
 * Compresses JSON/text responses >= 1024 bytes when client accepts gzip or deflate.
 * Typically reduces payload sizes by 70% to 90%.
 */
export const responseCompression = (req, res, next) => {
  const acceptEncoding = req.headers["accept-encoding"] || "";

  if (!acceptEncoding.includes("gzip") && !acceptEncoding.includes("deflate")) {
    return next();
  }

  const originalSend = res.send;

  res.send = function (body) {
    if (!body || req.method === "HEAD") {
      return originalSend.call(this, body);
    }

    const isBuffer = Buffer.isBuffer(body);
    const isString = typeof body === "string";

    if (!isBuffer && !isString) {
      return originalSend.call(this, body);
    }

    const byteLength = isBuffer ? body.length : Buffer.byteLength(body);
    // Only compress responses >= 1KB
    if (byteLength < 1024) {
      return originalSend.call(this, body);
    }

    // Skip if already compressed
    if (res.getHeader("Content-Encoding")) {
      return originalSend.call(this, body);
    }

    try {
      if (acceptEncoding.includes("gzip")) {
        const compressed = zlib.gzipSync(body, { level: 6 });
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Vary", "Accept-Encoding");
        res.removeHeader("Content-Length");
        return originalSend.call(this, compressed);
      } else if (acceptEncoding.includes("deflate")) {
        const compressed = zlib.deflateSync(body, { level: 6 });
        res.setHeader("Content-Encoding", "deflate");
        res.setHeader("Vary", "Accept-Encoding");
        res.removeHeader("Content-Length");
        return originalSend.call(this, compressed);
      }
    } catch {
      // Fallback safely to uncompressed body
      return originalSend.call(this, body);
    }

    return originalSend.call(this, body);
  };

  next();
};


/**
 * Standardized error extractor to ensure backend error messages
 * are properly surfaced on the frontend across all sections.
 */
export function getBackendErrorMessage(error, fallback = "Something went wrong") {
  if (!error) return fallback;
  if (typeof error === "string") return error;

  const data = error.response?.data || error.data;

  if (data) {
    // If backend returned a raw string (e.g., res.status(400).send("Custom error"))
    if (typeof data === "string") {
      // Ignore raw HTML error page snippets (e.g. 500 Nginx/Express default crash pages)
      if (data.trim().startsWith("<!DOCTYPE") || data.trim().startsWith("<html")) {
        return "Server error occurred. Please try again later.";
      }
      return data;
    }

    // Standard { message: "..." }
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }

    // Array of validation messages: { message: ["Field required", "Invalid email"] }
    if (Array.isArray(data.message) && data.message.length > 0) {
      return data.message
        .map((item) => (typeof item === "string" ? item : item?.message || item?.msg || JSON.stringify(item)))
        .join("; ");
    }

    // Standard { error: "..." }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }

    // Nested error object: { error: { message: "..." } }
    if (data.error && typeof data.error === "object") {
      if (typeof data.error.message === "string") return data.error.message;
      if (typeof data.error.msg === "string") return data.error.msg;
    }

    // Express-validator format: { errors: [ { msg: "..." } ] }
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors
        .map((item) => (typeof item === "string" ? item : item?.msg || item?.message || item?.detail || JSON.stringify(item)))
        .join("; ");
    }

    // Keyed validation errors: { errors: { email: "Invalid", name: "Required" } }
    if (data.errors && typeof data.errors === "object") {
      const msgs = Object.values(data.errors)
        .map((val) => (typeof val === "string" ? val : val?.message || val?.msg || JSON.stringify(val)))
        .filter(Boolean);
      if (msgs.length > 0) return msgs.join("; ");
    }

    // Python / FastAPI / Django style: { detail: "..." }
    if (typeof data.detail === "string" && data.detail.trim()) {
      return data.detail;
    }

    // Alternative short message: { msg: "..." }
    if (typeof data.msg === "string" && data.msg.trim()) {
      return data.msg;
    }
  }

  // Fallback to error.message if it's not a generic Axios HTTP code string
  if (error.message && typeof error.message === "string") {
    if (
      !error.message.startsWith("Request failed with status code") &&
      error.message !== "Network Error"
    ) {
      return error.message;
    }
  }

  // Specific HTTP status code fallbacks
  const status = error.status || error.response?.status;
  if (status === 404) return "Requested resource was not found.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 401) return "Invalid credentials or session expired. Please sign in.";
  if (status >= 500) return "Server encountered an error. Please try again later.";

  return fallback;
}

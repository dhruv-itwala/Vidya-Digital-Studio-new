import toast from "react-hot-toast";

/**
 * Validates a file against size and type constraints before uploading.
 * 
 * @param {File} file 
 * @param {Object} options
 * @param {number} [options.maxSizeMB=5] - Maximum size in MB
 * @param {string[]} [options.allowedTypes] - Allowed MIME types (e.g., ['image/jpeg', 'image/png'])
 * @param {string[]} [options.allowedExtensions] - Allowed extensions (e.g., ['.pdf', '.docx'])
 * @param {string} [options.fileLabel='File'] - Label used in toast messages
 * @returns {boolean} true if valid, false otherwise
 */
export function validateFile(file, options = {}) {
  const {
    maxSizeMB = 5,
    allowedTypes = [],
    allowedExtensions = [],
    fileLabel = "File",
  } = options;

  if (!file) {
    toast.error(`Please select a ${fileLabel.toLowerCase()}.`);
    return false;
  }

  // Size validation
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const actualMB = (file.size / (1024 * 1024)).toFixed(2);
    toast.error(`${fileLabel} is too large (${actualMB} MB). Maximum allowed size is ${maxSizeMB} MB.`);
    return false;
  }

  // MIME type validation
  if (allowedTypes.length > 0) {
    const isMimeValid = allowedTypes.some((type) => {
      if (type.endsWith("/*")) {
        const prefix = type.split("/")[0];
        return file.type.startsWith(`${prefix}/`);
      }
      return file.type === type;
    });

    if (!isMimeValid) {
      toast.error(`Invalid file format for ${fileLabel.toLowerCase()}.`);
      return false;
    }
  }

  // Extension validation
  if (allowedExtensions.length > 0) {
    const fileName = file.name.toLowerCase();
    const hasValidExt = allowedExtensions.some((ext) =>
      fileName.endsWith(ext.toLowerCase())
    );

    if (!hasValidExt) {
      toast.error(
        `Allowed file types: ${allowedExtensions.join(", ")}`
      );
      return false;
    }
  }

  return true;
}

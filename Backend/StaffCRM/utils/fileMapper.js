// Backend/StaffCRM/utils/fileMapper.js
export const mapFiles = (files = []) =>
  files.map((file) => ({
    url: file.path,
    publicId: file.filename,
    date: new Date(),
  }));

export const roleRedirect = (role) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "employee":
    case "hr":
      return "/employee/dashboard";
    default:
      return "/login";
  }
};

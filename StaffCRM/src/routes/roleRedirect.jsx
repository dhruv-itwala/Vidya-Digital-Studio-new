export const roleRedirect = (role) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "employee":
      return "/employee/dashboard";
    case "hr":
      return "/hr/dashboard";
    default:
      return "/login";
  }
};

export const roleRedirect = (role) => {
  switch (role) {
    case "administrative":
    case "admin":
      return "/admin/dashboard";

    case "employee":
    case "intern":
      return "/employee/dashboard";

    case "hr":
      return "/hr/dashboard";

    default:
      return "/login";
  }
};

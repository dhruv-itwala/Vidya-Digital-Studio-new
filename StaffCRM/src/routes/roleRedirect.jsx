export const roleRedirect = (role) => {
  switch (role) {
    case "admin":
      return "/admin/attendance";

    case "employee":
    case "intern":
      return "/employee/dashboard";

    case "hr":
      return "/hr/dashboard";

    default:
      return "/login";
  }
};

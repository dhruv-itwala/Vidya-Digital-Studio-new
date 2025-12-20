import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/Navbar/AdminNavbar";

export default function AdminLayout() {
  return (
    <>
      <AdminNavbar />
      <main style={{ padding: "24px" }}>
        <Outlet />
      </main>
    </>
  );
}

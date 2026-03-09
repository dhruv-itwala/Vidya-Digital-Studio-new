import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";

export default function AdminLayout() {
  return (
    <>
      <Navbar />
      <main style={{ padding: "24px" }}>
        <Outlet />
      </main>
    </>
  );
}

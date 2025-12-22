import { Outlet } from "react-router-dom";
import HRNavbar from "../components/Navbar/HrNavbar";

export default function HRLayout() {
  return (
    <>
      <HRNavbar />
      <main style={{ padding: "24px" }}>
        <Outlet />
      </main>
    </>
  );
}

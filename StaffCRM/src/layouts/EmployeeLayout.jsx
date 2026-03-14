import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";

export default function EmployeeLayout() {
  return (
    <>
      <Navbar />
      <main style={{ paddingBottom: "20px" }}>
        <Outlet />
      </main>
    </>
  );
}

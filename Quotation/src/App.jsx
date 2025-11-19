import { ToastContainer } from "react-toastify";
import Navbar from "./components/Navbar/Navbar";
import UiHeroSection from "./components/UiHeroSection/UiHeroSection";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import QuoteBuilder from "./pages/QuoteBuilder";
import Footer from "./components/Footer/Footer";
const App = () => {
  return (
    <>
      <Navbar />
      <UiHeroSection />
      <QuoteBuilder />
      <ToastContainer position="bottom-right" autoClose={3000} />
      <Footer />
    </>
  );
};

export default App;

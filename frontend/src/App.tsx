import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";

// AnimatePresence wrapper component
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </AnimatePresence>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

function App() {
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <ScrollToTop />
          <AnimatedRoutes />
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ErrorPage from "./pages/ErrorPage";
import BadRequestPage from "./pages/BadRequestPage";

// Error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Define error handler
    const handleError = (error: ErrorEvent) => {
      console.error("Caught an error:", error);
      setError(error.error);
      setHasError(true);
    };

    // Add global error listener
    window.addEventListener("error", handleError);

    // Cleanup listener
    return () => window.removeEventListener("error", handleError);
  }, []);

  // Reset error state when route changes
  useEffect(() => {
    if (hasError) {
      setHasError(false);
      setError(null);
    }
  }, [navigate]);

  if (hasError) {
    return <ErrorPage error={error} />;
  }

  return <>{children}</>;
}

// Create an error trigger component for testing
function ErrorTrigger() {
  const [error, setError] = useState<string | null>(null);
  
  const triggerError = (type: string) => {
    try {
      if (type === 'type') {
        throw new TypeError("Invalid data type");
      } else if (type === 'reference') {
        throw new ReferenceError("Undefined variable");
      } else if (type === 'uri') {
        throw new URIError("Invalid URI");
      } else {
        throw new Error("Generic error");
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };
  
  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl mb-6">Error Trigger Page</h1>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
        <button 
          onClick={() => triggerError('type')} 
          className="px-4 py-2 bg-red-500 rounded"
        >
          Trigger TypeError
        </button>
        <button 
          onClick={() => triggerError('reference')} 
          className="px-4 py-2 bg-red-500 rounded"
        >
          Trigger ReferenceError
        </button>
        <button 
          onClick={() => triggerError('uri')} 
          className="px-4 py-2 bg-red-500 rounded"
        >
          Trigger URIError
        </button>
        <button 
          onClick={() => triggerError('generic')} 
          className="px-4 py-2 bg-red-500 rounded"
        >
          Trigger Generic Error
        </button>
      </div>
      {error && <p>Error message: {error}</p>}
    </div>
  );
}

// AnimatePresence wrapper component
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Error pages */}
        <Route path="/400" element={<BadRequestPage />} />
        <Route path="/500" element={<ErrorPage />} />
        <Route path="/error-trigger" element={<ErrorTrigger />} />
        <Route path="*" element={<NotFound />} />
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
          <ErrorBoundary>
            <AnimatedRoutes />
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

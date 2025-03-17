import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, RefreshCw, AlertTriangle } from "lucide-react";
import { useEffect } from "react";

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
  error?: Error | null;
}

// Helper function to get error details
const getErrorDetails = (error?: Error | null, statusCode = 500) => {
  // Default values
  let errorCode = statusCode;
  let errorTitle = "Server Error";
  let errorMessage = "Something went wrong on our end. Please try again later.";
  
  // If no specific error is provided, use the status code to determine details
  if (!error) {
    if (statusCode === 404) {
      errorTitle = "Page Not Found";
      errorMessage = "The page you're looking for doesn't exist or has been moved.";
    } else if (statusCode === 400) {
      errorTitle = "Bad Request";
      errorMessage = "There was an issue with your request. Please check your information and try again.";
    }
    return { errorCode, errorTitle, errorMessage };
  }
  
  // Determine error type from the error object
  if (error instanceof TypeError) {
    errorCode = 400;
    errorTitle = "Bad Request";
    errorMessage = error.message || "Invalid data or parameters in the request.";
  } else if (error instanceof ReferenceError) {
    errorCode = 500;
    errorTitle = "Server Error";
    errorMessage = "We encountered an issue with our code. Our team has been notified.";
  } else if (error instanceof URIError) {
    errorCode = 400;
    errorTitle = "Bad URL";
    errorMessage = "The URL contains invalid characters or formatting.";
  } else if (error.name === "NetworkError" || error.message.includes("network")) {
    errorCode = 503;
    errorTitle = "Network Error";
    errorMessage = "Unable to connect to the server. Please check your internet connection.";
  }
  
  return { errorCode, errorTitle, errorMessage };
};

const ErrorPage = ({
  statusCode = 500,
  title,
  message,
  error = null
}: ErrorPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Process error details
  const { errorCode, errorTitle, errorMessage } = getErrorDetails(error, statusCode);
  const finalTitle = title || errorTitle;
  const finalMessage = message || errorMessage;

  // Logging
  useEffect(() => {
    console.error(
      `Error encountered: ${errorCode} ${finalTitle}\n`,
      `Path: ${location.pathname}\n`,
      `Message: ${finalMessage}\n`,
      error ? error : "No error object available"
    );
  }, [error, errorCode, finalTitle, finalMessage, location.pathname]);

  // Handle refresh/retry
  const handleRetry = () => {
    navigate(0); // Refresh the current page
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center min-h-[80vh] px-4"
    >
      <div className="text-center max-w-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, 0, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-primary"
            >
              <AlertTriangle size={64} />
            </motion.div>
          </div>
          <h1 className="text-9xl font-bold text-primary">{errorCode}</h1>
          <div className="text-2xl font-semibold mt-4 mb-2">{finalTitle}</div>
          <p className="text-muted-foreground">
            {finalMessage}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button onClick={handleRetry} variant="outline" className="gap-2">
            <RefreshCw size={16} /> Try Again
          </Button>
          <Link to="/">
            <Button className="gap-2 w-full">
              <Home size={16} /> Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ErrorPage; 
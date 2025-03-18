import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import apiService from "../services/api";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// API error interface
interface ApiError {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    
    try {
      // Use real API service for login
      const response = await apiService.login(data.email, data.password);
      
      if (response.success && response.data) {
        toast.success("Login successful!", {
          description: `Welcome back, ${response.data.user.name}!`,
        });
        navigate("/dashboard"); // Redirect to dashboard after successful login
      } else {
        // Handle unexpected success:false response
        toast.error("Login failed", {
          description: response.message || "Please check your credentials and try again.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Type cast error to ApiError
      const apiError = error as ApiError;
      
      // Handle validation errors from API
      if (apiError.errors) {
        // Set form errors from API
        Object.entries(apiError.errors).forEach(([field, messages]) => {
          form.setError(field as keyof LoginFormValues, {
            type: "server",
            message: messages[0],
          });
        });
      }
      
      toast.error("Login failed", {
        description: apiError.message || "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-[calc(100vh-theme(spacing.header))] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background/80 to-background"
    >
      <div className="w-full max-w-md space-y-8 backdrop-blur-lg bg-background/30 p-8 rounded-xl shadow-lg border border-border/40">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="your.email@example.com" 
                      {...field} 
                      disabled={isLoading}
                      className="bg-background/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                        className="bg-background/50 pr-10"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={toggleShowPassword}
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      tabIndex={-1}
                    >
                      {showPassword ? 
                        <EyeOff className="h-4 w-4" /> : 
                        <Eye className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link 
                  to="#" 
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link 
            to="/register" 
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign up
          </Link>
        </div>
      </div>
    </motion.div>
  );
} 
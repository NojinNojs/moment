import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, Eye, EyeOff, CheckCircle2 } from "lucide-react";
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

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// API error interface
interface ApiError {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const password = form.watch("password");
  const passwordRequirements = [
    { id: "length", text: "At least 8 characters", regex: /.{8,}/ },
    { id: "uppercase", text: "At least one uppercase letter", regex: /[A-Z]/ },
    { id: "lowercase", text: "At least one lowercase letter", regex: /[a-z]/ },
    { id: "number", text: "At least one number", regex: /[0-9]/ },
    {
      id: "special",
      text: "At least one special character",
      regex: /[^A-Za-z0-9]/,
    },
  ];

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);

    try {
      // Use real API service for registration
      const response = await apiService.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (response.success && response.data) {
        toast.success("Registration successful!", {
          description: `Welcome, ${response.data.user.name}! Your account has been created.`,
        });
        
        // Could redirect directly to dashboard since we're already logged in
        // navigate("/dashboard");
        
        // Or redirect to login page as originally designed
        navigate("/login");
      } else {
        // Handle unexpected success:false response
        toast.error("Registration failed", {
          description: response.message || "Please check your information and try again.",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      // Type cast error to ApiError
      const apiError = error as ApiError;
      
      // Handle validation errors from API
      if (apiError.errors) {
        // Set form errors from API
        Object.entries(apiError.errors).forEach(([field, messages]) => {
          // Handle backend field names that might be different from frontend
          const fieldName = field === 'name' ? 'name' :
                          field === 'email' ? 'email' :
                          field === 'password' ? 'password' : field as keyof RegisterFormValues;
                          
          form.setError(fieldName, {
            type: "server",
            message: messages[0],
          });
        });
      }
      
      toast.error("Registration failed", {
        description: apiError.message || "Please check your information and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const nextStep = async () => {
    const isValid = await form.trigger(["name", "email"]);
    if (isValid) {
      // Clear any potential values from step 2 to avoid issues
      form.resetField("password");
      form.resetField("confirmPassword");
      
      setStep(2);
    }
  };

  const prevStep = () => setStep(1);

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
            Create an account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign up to get started
          </p>
          {/* Progress indicator */}
          <div className="flex items-center justify-center mt-6">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                1
              </div>
              <div
                className={`w-12 h-1 ${step >= 2 ? "bg-primary" : "bg-muted"}`}
              ></div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your.email@example.com"
                          type="email"
                          {...field}
                          disabled={isLoading}
                          className="bg-background/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  disabled={isLoading}
                  className="w-full"
                  onClick={nextStep}
                >
                  Continue
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
                key="step2"
              >
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
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
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
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />

                      {/* Password requirements */}
                      <div className="mt-3 space-y-2">
                        {passwordRequirements.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center space-x-2 text-xs"
                          >
                            {req.regex.test(password || "") ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                            )}
                            <span
                              className={
                                req.regex.test(password || "")
                                  ? "text-green-500"
                                  : "text-muted-foreground"
                              }
                            >
                              {req.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            disabled={isLoading}
                            className="bg-background/50 pr-10"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={toggleShowConfirmPassword}
                          className="absolute right-0 top-0 h-full px-3 py-2"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    className="flex-1"
                    onClick={prevStep}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Sign up
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </form>
        </Form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign in
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

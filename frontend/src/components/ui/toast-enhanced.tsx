import { Toaster as Sonner, toast } from "sonner";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const toastVariants = cva(
  "group toast group flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[opened]:animate-in data-[closed]:animate-out data-[closed]:fade-out-80 data-[closed]:slide-out-to-right-full data-[opened]:slide-in-from-top-full mb-safe-area-inset-bottom",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        success: "success group border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 text-green-800 dark:text-green-300",
        error: "error group border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 text-red-800 dark:text-red-300",
        warning: "warning group border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300",
        info: "info group border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 text-blue-800 dark:text-blue-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  closeButton?: boolean;
}

// Create the useToast hook ourselves for compatibility
export const useToast = () => {
  return {
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        toast.dismiss(toastId);
      } else {
        toast.dismiss();
      }
    },
    success: (message: string, options?: Parameters<typeof toast>[1]) => 
      toast.success(message, options),
    error: (message: string, options?: Parameters<typeof toast>[1]) => 
      toast.error(message, options),
    warning: (message: string, options?: Parameters<typeof toast>[1]) => 
      toast.warning(message, options),
    info: (message: string, options?: Parameters<typeof toast>[1]) => 
      toast.info(message, options),
  };
};

// Alias definitions for missing components
export const ToastProvider = Sonner;
export const ToastViewport = ({ ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />;
export const ToastHeading = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props}>{children}</h2>;
export const ToastDescription = ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>;
export const ToastClose = ({ ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}><X className="h-4 w-4" /></button>;
export const ToastAction = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>;
export const ToastTitle = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props}>{children}</h2>;

export function Toast({
  className,
  variant,
  title,
  description,
  closeButton = true,
  ...props
}: ToastProps) {
  const getIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-start gap-3 w-full">
        {getIcon()}
        <div className="flex-1 grid gap-1">
          {title && <div className="font-semibold">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
        {closeButton && (
          <button className="absolute top-2 right-2 rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:text-foreground hover:opacity-100 focus:opacity-100 focus:outline-none group-hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "group toast group flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-6 shadow-lg mb-safe-area-inset-bottom", 
          title: "text-foreground font-medium",
          description: "text-foreground text-sm",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: toastVariants({ variant: "success" }),
          error: toastVariants({ variant: "error" }),
          warning: toastVariants({ variant: "warning" }),
          info: toastVariants({ variant: "info" }),
        },
      }}
      {...props}
    />
  );
}

// Re-export toast
export { toast };
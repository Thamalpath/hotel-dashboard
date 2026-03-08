"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPasswordType = type === "password";

    const handleTogglePassword = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="relative w-full">
        <input
          type={isPasswordType && showPassword ? "text" : type}
          ref={ref}
          className={cn(
            "input !text-xs h-8 px-2 py-1 aria-[invalid=true]:border-destructive",
            "disabled:cursor-not-allowed",
            "disabled:bg-neutral-100 disabled:text-neutral-500",
            "dark:disabled:bg-neutral-800 dark:disabled:text-neutral-400",
            isPasswordType ? "pr-8" : "",
            className
          )}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={handleTogglePassword}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

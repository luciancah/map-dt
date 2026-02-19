import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "ghost"
  | "link"
  | "secondary-outline";

type ButtonSize = "default" | "sm" | "lg" | "icon";

const buttonVariantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-orange-600 text-white hover:bg-orange-500 focus-visible:ring-orange-400",
  secondary:
    "bg-stone-200 text-stone-800 hover:bg-stone-300 border border-stone-300",
  outline:
    "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
  destructive:
    "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-400",
  ghost: "bg-transparent text-stone-700 hover:bg-stone-100",
  link: "text-stone-700 underline underline-offset-4 hover:text-stone-900",
  "secondary-outline": "bg-white border border-stone-300 text-stone-700 hover:bg-stone-50",
};

const buttonSizeStyles: Record<ButtonSize, string> = {
  default: "px-3 py-1.5 text-sm",
  sm: "px-2 py-1 text-xs",
  lg: "px-4 py-2 text-sm",
  icon: "h-6 w-6 p-0",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          buttonVariantStyles[variant],
          buttonSizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { buttonVariantStyles };

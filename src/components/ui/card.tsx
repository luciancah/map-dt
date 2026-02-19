import * as React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200 bg-white shadow-sm",
        className,
      )}
      {...props}
    />
  );
};

export const CardHeader = ({ className, ...props }: CardProps) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-4", className)} {...props} />
  );
};

export const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h2
      className={cn(
        "text-sm font-semibold leading-none tracking-tight text-stone-900",
        className,
      )}
      {...props}
    />
  );
};

export const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p
      className={cn("text-xs text-stone-500", className)}
      {...props}
    />
  );
};

export const CardContent = ({ className, ...props }: CardProps) => {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
};

export const CardFooter = ({ className, ...props }: CardProps) => {
  return <div className={cn("flex items-center p-4 pt-0", className)} {...props} />;
};

import * as React from "react";

import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  onValueChange?: (next: string) => void;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, onValueChange, onChange, ...props }, ref) => {
    return (
      <select
        ref={ref}
        onChange={(event) => {
          onValueChange?.(event.target.value);
          onChange?.(event);
        }}
        className={cn(
          "flex h-9 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900",
          className,
        )}
        {...props}
      />
    );
  },
);

Select.displayName = "Select";

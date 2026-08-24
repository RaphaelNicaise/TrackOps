import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  sizeVariant?: "sm" | "default" | "lg";
  containerClassName?: string;
}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    {
      className,
      containerClassName,
      children,
      sizeVariant = "default",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("relative w-full", containerClassName)}>
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            "flex w-full appearance-none items-center rounded-xl border border-input bg-card font-normal text-foreground shadow-2xs transition-colors cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&>option]:bg-card [&>option]:text-foreground [&>optgroup]:bg-card [&>optgroup]:text-foreground",
            sizeVariant === "sm" && "h-8 px-2.5 pr-7 text-xs rounded-lg",
            sizeVariant === "default" && "h-9 px-3 pr-8 text-sm rounded-xl",
            sizeVariant === "lg" && "h-10 px-3.5 pr-8 text-sm rounded-xl",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-60 transition-opacity",
            sizeVariant === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
            disabled && "opacity-30"
          )}
        />
      </div>
    );
  }
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };

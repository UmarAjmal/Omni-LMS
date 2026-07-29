import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "outline";
}

export function Badge({ className = "", variant = "primary", children, ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors";
  
  const variants = {
    primary: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-indigo-100 text-indigo-800",
    outline: "border border-gray-200 text-gray-800",
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

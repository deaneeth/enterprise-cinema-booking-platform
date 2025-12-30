import React from "react";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const Spinner: React.FC<{ colorClass: string }> = ({ colorClass }) => (
  <svg
    className={`h-4 w-4 animate-spin ${colorClass}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v8z"
    ></path>
  </svg>
);

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants: Record<Variant, string> = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const disabledClass = isDisabled ? "opacity-60 cursor-not-allowed" : "";

  const spinnerColor = variant === "secondary" ? "text-gray-500" : "text-white";

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={`${base} ${variants[variant]} ${disabledClass} ${className}`}
    >
      {loading && <Spinner colorClass={spinnerColor} />}
      <span>{children}</span>
    </button>
  );
};

export default Button;

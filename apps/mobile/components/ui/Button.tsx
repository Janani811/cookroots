import { ActivityIndicator, Pressable, PressableProps, Text } from "react-native";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  children: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const containerByVariant: Record<Variant, string> = {
  primary: "bg-primary",
  outline: "border border-primary bg-transparent",
  ghost: "bg-transparent",
  danger: "border border-danger bg-transparent",
};

const textByVariant: Record<Variant, string> = {
  primary: "text-white",
  outline: "text-primary",
  ghost: "text-neutral-900 dark:text-neutral-100",
  danger: "text-danger",
};

const paddingBySize: Record<Size, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
  lg: "px-5 py-4",
};

const textSizeBySize: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = true,
  disabled,
  className,
  ...props
}: ButtonProps & { className?: string }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      className={`rounded-xl items-center justify-center flex-row gap-2 ${paddingBySize[size]} ${containerByVariant[variant]} ${fullWidth ? "" : "self-start"} ${isDisabled ? "opacity-50" : ""} ${className ?? ""}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <ActivityIndicator size="small" color={variant === "primary" ? "#fff" : "#4C9A2A"} />
      )}
      <Text className={`text-center font-semibold ${textSizeBySize[size]} ${textByVariant[variant]}`}>
        {children}
      </Text>
    </Pressable>
  );
}

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "w-3.5 h-3.5 border-[1.5px]",
  md: "w-4 h-4 border-2",
  lg: "w-5 h-5 border-2",
};

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={`inline-block rounded-full border-current border-t-transparent animate-spin ${sizes[size]} ${className}`}
    />
  );
}

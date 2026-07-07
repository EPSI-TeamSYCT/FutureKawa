import type { CSSProperties } from "react";
import "./Skeleton.css";

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  variant?: "rect" | "text" | "circle";
  className?: string;
  style?: CSSProperties;
}

/** Placeholder shimmer shown while data loads. Never a full-screen spinner. */
export function Skeleton({
  width,
  height,
  radius,
  variant = "rect",
  className = "",
  style,
}: Readonly<SkeletonProps>) {
  const defaultRadius: Record<"rect" | "text" | "circle", string> = {
    circle: "var(--fk-radius-full)",
    text: "4px",
    rect: "var(--fk-radius-btn)",
  };
  const resolved: CSSProperties = {
    width,
    height: height ?? (variant === "text" ? "0.9em" : undefined),
    borderRadius: radius ?? defaultRadius[variant],
    ...style,
  };
  return (
    <span
      className={`fk-skeleton ${className}`.trim()}
      style={resolved}
      aria-hidden="true"
      data-variant={variant}
    />
  );
}

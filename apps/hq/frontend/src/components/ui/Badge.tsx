import type { ReactNode } from "react";
import "./Badge.css";

export type BadgeTone = "neutral" | "success" | "alert" | "danger" | "accent";
export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  tone?: BadgeTone;
  size?: BadgeSize;
  /** Small leading pastille dot (colour inherited from the tone). */
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Generic status pill. Never colour-only — pair a tone with a `dot` or `icon`
 * and a text label so meaning survives for colour-blind users.
 */
export function Badge({
  tone = "neutral",
  size = "md",
  dot = false,
  icon,
  className = "",
  children,
}: Readonly<BadgeProps>) {
  const classes = ["fk-badge", `fk-badge--${tone}`, `fk-badge--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {dot && <span className="fk-badge-dot" aria-hidden="true" />}
      {icon && (
        <span className="fk-badge-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

import type { LucideIcon } from "lucide-react";
import type { SVGProps } from "react";

type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  icon: LucideIcon;
  size?: IconSize | number;
  strokeWidth?: number;
  label?: string;
}

/** Consistent icon wrapper — lucide-react, bundled locally. */
export function Icon({
  icon: LucideComponent,
  size = "md",
  strokeWidth = 2,
  label,
  className = "",
  ...props
}: IconProps) {
  const px = typeof size === "number" ? size : SIZE_MAP[size];

  return (
    <LucideComponent
      size={px}
      strokeWidth={strokeWidth}
      className={`icon ${className}`.trim()}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      {...props}
    />
  );
}

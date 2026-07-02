import { AlertTriangle, CircleCheck, CircleDot, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Band } from "@/types/composite";

const BAND_CONFIG: Record<Band, { icon: typeof CircleCheck; className: string }> = {
  Excellent: { icon: CircleCheck, className: "bg-band-excellent text-band-excellent-foreground" },
  Strong: { icon: TrendingUp, className: "bg-band-strong text-band-strong-foreground" },
  Average: { icon: CircleDot, className: "bg-band-average text-band-average-foreground" },
  "High risk": { icon: AlertTriangle, className: "bg-band-risk text-band-risk-foreground" },
};

/// Color is reinforcement, never the only signal (Handbook §4.8 / §14): the
/// icon and label text always render alongside the band color.
export const BandBadge = ({ band, className }: { band: Band; className?: string }) => {
  const { icon: Icon, className: bandClassName } = BAND_CONFIG[band];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium",
        bandClassName,
        className,
      )}
    >
      <Icon className="size-4" />
      {band}
    </span>
  );
};

import { Check, Circle, Clock, TriangleAlert } from "lucide-react";
import "./LotTimeline.css";

export type TimelineState = "done" | "alert" | "pending";

export interface TimelineStep {
  label: string;
  sublabel?: string;
  state: TimelineState;
}

const ICONS = {
  done: Check,
  alert: TriangleAlert,
  pending: Circle,
} as const;

export interface LotTimelineProps {
  steps: TimelineStep[];
}

/** Horizontal lot timeline — done (green) / alert (caramel) / pending (neutral). */
export function LotTimeline({ steps }: Readonly<LotTimelineProps>) {
  return (
    <ol className="fk-timeline">
      {steps.map((step, i) => {
        const Icon = step.state === "pending" ? Clock : ICONS[step.state];
        return (
          <li className={`fk-timeline-step is-${step.state}`} key={`${step.label}-${i}`}>
            <span className="fk-timeline-node" aria-hidden="true">
              <Icon size={13} strokeWidth={2} />
            </span>
            <span className="fk-timeline-label">{step.label}</span>
            {step.sublabel && <span className="fk-timeline-sub fk-mono">{step.sublabel}</span>}
          </li>
        );
      })}
    </ol>
  );
}

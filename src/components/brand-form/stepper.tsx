import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StepDefinition {
  key: string;
  label: string;
}

interface StepperProps {
  steps: StepDefinition[];
  currentIndex: number;
}

export function Stepper({ steps, currentIndex }: StepperProps) {
  return (
    <ol className="flex w-full items-start">
      {steps.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <li key={step.key} className="flex min-w-0 flex-1 items-start last:flex-none">
            <div className="flex min-w-0 flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-caption font-medium transition-colors",
                  isComplete && "bg-admin-accent text-white",
                  isCurrent && "bg-admin-accent text-white",
                  !isComplete && !isCurrent && "bg-canvas text-mid-gray border border-hairline"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? <Check size={14} strokeWidth={2.5} /> : index + 1}
              </div>
              <span
                className={cn(
                  "max-w-16 text-center text-caption leading-tight break-words sm:max-w-none sm:whitespace-nowrap",
                  isCurrent ? "text-admin-accent font-medium" : "text-mid-gray"
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast ? (
              <div
                className={cn(
                  "mx-1.5 mt-4 h-px min-w-2 flex-1 transition-colors sm:mx-3",
                  isComplete ? "bg-admin-accent" : "bg-hairline"
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

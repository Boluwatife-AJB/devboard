"use client";

const ACTIVE_COLOR = "oklch(0.5854 0.2041 277.12)";
const COMPLETE_COLOR = "#00c853";
const INACTIVE_COLOR = "rgb(51, 52, 60)";

interface FormStepIndicatorProps {
  currentStep: number;
  steps: { label: string }[];
}

export function FormStepIndicator({
  currentStep,
  steps,
}: FormStepIndicatorProps) {
  const totalSteps = steps.length;

  return (
    <div className="space-y-2 mb-6">
      <div className="flex gap-1">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;
          const isFilled = isComplete || isActive;

          return (
            <div
              key={step.label}
              className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: isFilled
                  ? isComplete
                    ? COMPLETE_COLOR
                    : ACTIVE_COLOR
                  : INACTIVE_COLOR,
                opacity: isFilled ? 1 : 0.3,
              }}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Registration Progress
        </span>
        <span className="text-xs font-semibold" style={{ color: ACTIVE_COLOR }}>
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      {/* <div className="grid grid-cols-1 gap-2 text-xs">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;
          const dotColor = isComplete
            ? COMPLETE_COLOR
            : isActive
              ? ACTIVE_COLOR
              : "rgb(70, 69, 84)";

          return (
            <div key={step.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: dotColor }}
              >
                {isComplete && (
                  <span className="text-white text-[10px]">✓</span>
                )}
              </div>
              <span
                className={
                  isComplete || isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div> */}
    </div>
  );
}

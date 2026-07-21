import { Check, Info, SlidersHorizontal, DollarSign, Warehouse, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";

const STEPS = [
  { id: 1, title: "Basic Information", subtitle: "Stock No, Name, Category", icon: Info },
  { id: 2, title: "Category Details", subtitle: "Dynamic Specifications", icon: SlidersHorizontal },
  { id: 3, title: "Pricing & Profit", subtitle: "Cost, Margin & Retail Price", icon: DollarSign },
  { id: 4, title: "Inventory & Supplier", subtitle: "Warehouse & Vendor Info", icon: Warehouse },
  { id: 5, title: "Review & Publish", subtitle: "Final Verification", icon: CheckCircle2 },
];

export default function WizardStepper({ activeStep, onStepClick, completedSteps = [] }) {
  const progressPercentage = Math.round(((activeStep - 1) / (STEPS.length - 1)) * 100);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs mb-6">
      {/* Top Header & Progress Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Step {activeStep} of {STEPS.length}
          </span>
          <h2 className="text-base font-bold text-gray-900">
            {STEPS.find((s) => s.id === activeStep)?.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500 font-mono">
            {progressPercentage}% Complete
          </span>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden mb-5">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Stepper Nodes Grid */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {STEPS.map((step) => {
          const isCurrent = step.id === activeStep;
          const isCompleted = completedSteps.includes(step.id) || step.id < activeStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(step.id)}
              className={cn(
                "flex flex-col items-center text-center group cursor-pointer transition-all p-1.5 sm:p-2 rounded-xl border",
                isCurrent
                  ? "border-primary bg-primary/5 text-primary shadow-2xs"
                  : isCompleted
                  ? "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  : "border-transparent text-gray-400 opacity-60 hover:opacity-100"
              )}
            >
              <div className="flex items-center justify-center gap-2 mb-0.5 sm:mb-1">
                <div
                  className={cn(
                    "flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-xs font-bold transition-all shrink-0",
                    isCurrent
                      ? "bg-primary text-white"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" /> : step.id}
                </div>
              </div>

              <span className="text-[11px] sm:text-xs font-bold line-clamp-1 hidden sm:block">
                {step.title}
              </span>
              <span className="text-[10px] text-gray-400 line-clamp-1 hidden md:block mt-0.5">
                {step.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

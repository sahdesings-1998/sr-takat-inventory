import { ArrowLeft, ArrowRight, Save, CheckCircle, X, Clock } from "lucide-react";
import Button from "@/components/ui/Button";

export default function WizardFooter({
  activeStep,
  totalSteps = 5,
  onPrev,
  onNext,
  onSaveDraft,
  onCancel,
  onSubmit,
  isSubmitting = false,
  autoSaveTime = null,
}) {
  const isFirst = activeStep === 1;
  const isLast = activeStep === totalSteps;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 rounded-none px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-2xl md:sticky md:bottom-0 md:z-30 md:rounded-2xl md:px-5 md:py-3 md:shadow-lg md:mt-8">
      {/* Single responsive row */}
      <div className="flex items-center justify-between gap-2 min-w-0">

        {/* ── Left: auto-save status ───────────────── */}
        <div className="flex items-center gap-1.5 shrink-0 min-w-0">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="hidden min-[420px]:inline text-[11px] text-gray-500 truncate">
            {autoSaveTime ? `Saved ${autoSaveTime}` : "Auto-save on"}
          </span>
          {/* Mobile step counter in place of long save text */}
          <span className="min-[420px]:hidden text-[11px] text-primary font-bold font-mono">
            {activeStep}/{totalSteps}
          </span>
        </div>

        {/* ── Right: action buttons ────────────────── */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Cancel — icon-only on very small screens, labeled on min-400px+ */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            icon={<X className="h-3.5 w-3.5" />}
            className="text-gray-500 hover:text-gray-900 px-1.5 min-[380px]:px-2.5 text-xs"
          >
            <span className="hidden min-[400px]:inline text-[11px] sm:text-xs">Cancel</span>
          </Button>

          {/* Save Draft — icon-only on very small screens, labeled on min-400px+ */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSaveDraft}
            disabled={isSubmitting}
            icon={<Save className="h-3.5 w-3.5" />}
            className="px-1.5 min-[380px]:px-2.5 text-xs"
          >
            <span className="hidden min-[400px]:inline text-[11px] sm:text-xs">Draft</span>
          </Button>

          {/* Divider */}
          <span className="h-5 w-px bg-gray-200 mx-0.5 sm:mx-1 shrink-0" />

          {/* Prev — only when not on first step */}
          {!isFirst && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPrev}
              disabled={isSubmitting}
              icon={<ArrowLeft className="h-3.5 w-3.5" />}
              className="px-1.5 min-[380px]:px-2.5 text-xs"
            >
              <span className="hidden min-[400px]:inline text-[11px] sm:text-xs">Prev</span>
            </Button>
          )}

          {/* Next / Publish */}
          {!isLast ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onNext}
              disabled={isSubmitting}
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              className="px-2 min-[380px]:px-3 text-xs"
            >
              <span className="text-[11px] sm:text-xs">Next</span>
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="sm"
              onClick={onSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              icon={<CheckCircle className="h-3.5 w-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 min-[380px]:px-3 text-xs"
            >
              <span className="hidden min-[420px]:inline text-[11px] sm:text-xs">Publish Product</span>
              <span className="min-[420px]:hidden text-[11px] sm:text-xs">Publish</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

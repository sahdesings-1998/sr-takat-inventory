import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Clock, RefreshCw, Trash2 } from "lucide-react";

export default function DraftRestoreModal({ isOpen, timestamp, onRestore, onDiscard }) {
  return (
    <Modal isOpen={isOpen} onClose={onDiscard} title="Unfinished Draft Found">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-900">Restore Previous Workspace Draft?</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              An unsaved draft was automatically saved on {timestamp || "recently"}. Would you like to resume where you left off?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDiscard}
            icon={<Trash2 className="h-4 w-4" />}
            className="text-danger hover:bg-red-50"
          >
            Discard Draft
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onRestore}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Resume Draft
          </Button>
        </div>
      </div>
    </Modal>
  );
}

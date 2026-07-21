import { useState } from "react";
import { FileText, Tag, Paperclip, History, Plus, X, Eye, Gem } from "lucide-react";
import Textarea from "@/components/ui/Textarea";
import FileUploader from "@/components/ui/FileUploader";
import Badge from "@/components/ui/Badge";
import { cn } from "@/utils/cn";

const SIDEBAR_TABS = [
  { id: "notes", label: "Notes", icon: FileText },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "documents", label: "Docs", icon: Paperclip },
  { id: "history", label: "Activity", icon: History },
];

export default function ProductSidebar({ watch, register, setValue, errors }) {
  const [activeSidebarTab, setActiveSidebarTab] = useState("notes");
  const [tagInput, setTagInput] = useState("");

  const stockNo = watch("stockNo") || "STK-DRAFT";
  const name = watch("name") || "New Product";
  const category = watch("category") || "Jewellery";
  const sellingPrice = Number(watch("sellingPrice") || 0);
  const totalCost = Number(watch("totalCost") || 0);
  const profit = Number(watch("profit") || 0);
  const margin = Number(watch("margin") || 0);
  const tags = watch("tags") || [];
  const history = watch("history") || [];

  const handleAddTag = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !tags.includes(val)) {
        const updated = [...tags, val];
        setValue("tags", updated, { shouldDirty: true });
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setValue("tags", updated, { shouldDirty: true });
  };

  return (
    <div className="w-full lg:w-80 shrink-0 space-y-4">
      {/* Executive Quick Preview Widget */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3 mb-3">
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block font-mono">
              #{stockNo}
            </span>
            <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{name}</h4>
          </div>
          <Badge variant="primary" className="text-[10px] px-2 py-0.5 shrink-0">
            {category}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
          <div>
            <span className="text-gray-400 text-[10px] block">Selling Price</span>
            <span className="font-bold text-primary font-mono text-sm">${sellingPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] block">Margin</span>
            <span className={`font-bold font-mono text-sm ${margin >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {margin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Right Sidebar Container */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        {/* Navigation Tab Bar */}
        <div className="flex border-b border-gray-200 bg-gray-50/70 p-1">
          {SIDEBAR_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeSidebarTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSidebarTab(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                  isActive
                    ? "bg-white text-primary shadow-2xs font-bold"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                <TabIcon className="h-3.5 w-3.5 mb-0.5" />
                <span className="text-[11px]">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body Content */}
        <div className="p-4 space-y-4 min-h-[300px]">
          {/* 1. Notes Tab */}
          {activeSidebarTab === "notes" && (
            <div className="space-y-4">
              <Textarea
                label="Internal Confidential Notes"
                rows={3}
                placeholder="Vault notes, cost origin, or private remarks..."
                {...register("internalNotes")}
              />

              <Textarea
                label="Special Instructions"
                rows={3}
                placeholder="Handling, cleaning, or setting instructions..."
                {...register("specialInstructions")}
              />

              <Textarea
                label="Customer Facing Notes"
                rows={3}
                placeholder="Invoice details, warranty text..."
                {...register("customerNotes")}
              />
            </div>
          )}

          {/* 2. Tags Tab */}
          {activeSidebarTab === "tags" && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-700 block">
                Product Tags & Keywords
              </label>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Type tag & press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {tags.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No tags added yet.</p>
                ) : (
                  tags.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 3. Documents & Attachments Tab */}
          {activeSidebarTab === "documents" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Warranty Document (PDF)
                </label>
                <FileUploader
                  value={watch("warranty")}
                  onChange={(url) => setValue("warranty", url, { shouldDirty: true })}
                  accept=".pdf"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  CAD / 3D Model File
                </label>
                <FileUploader
                  value={watch("cadFiles")}
                  onChange={(url) => setValue("cadFiles", url, { shouldDirty: true })}
                  accept=".stl,.obj,.3dm,.pdf"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Product Documents / Manual
                </label>
                <FileUploader
                  value={watch("documents")}
                  onChange={(url) => setValue("documents", url, { shouldDirty: true })}
                  accept=".pdf,.doc,.docx"
                />
              </div>
            </div>
          )}

          {/* 4. Activity & History Log Tab */}
          {activeSidebarTab === "history" && (
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                Append-Only Audit Log
              </h5>
              {history.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  <History className="h-6 w-6 mx-auto mb-1 text-gray-300" />
                  <p>Product creation in progress...</p>
                  <p className="text-[10px] text-gray-400">Logs recorded on publish</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((entry, idx) => (
                    <div key={idx} className="flex gap-2.5 text-xs">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                        <History className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{entry.action}</p>
                        <p className="text-[10px] text-gray-400">
                          {entry.date ? new Date(entry.date).toLocaleString() : "Just now"} • User: {entry.user || "System"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

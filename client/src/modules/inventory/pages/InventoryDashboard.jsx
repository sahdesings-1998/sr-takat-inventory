import { useState } from "react";
import { Layers, Settings2 } from "lucide-react";
import LotList from "./LotList";
import MaterialList from "./MaterialList";

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState("lots");

  const tabClass = (tabId) =>
    `flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all duration-150 cursor-pointer ${activeTab === tabId
      ? "border-accent text-accent"
      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">Gemstone Lots & Materials Inventory</h1>
        <p className="mt-1 text-sm text-gray-600 font-medium">
          Track gemstone parcel lots, metal alloys, and raw inventory items across all locations
        </p>
      </div>

      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab("lots")} className={tabClass("lots")}>
          <Layers className="h-4.5 w-4.5" /> Gemstone Lots
        </button>
        <button onClick={() => setActiveTab("materials")} className={tabClass("materials")}>
          <Settings2 className="h-4.5 w-4.5" /> Raw Materials & Metals
        </button>
      </div>

      <div>
        {activeTab === "lots" && <LotList />}
        {activeTab === "materials" && <MaterialList />}
      </div>
    </div>
  );
}

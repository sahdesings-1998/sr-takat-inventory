import { useValuation, useRevenues } from "@/modules/dashboard/hooks/useReports";
import Button from "@/components/ui/Button";

export default function Reports() {
  const { data: valData } = useValuation();
  const { data: revData } = useRevenues();

  const val = valData?.data || { gemstoneValue: 0, productValue: 0, materialValue: 0, totalValue: 0 };
  const rev = revData?.data || { totalRevenue: 0, totalCharity: 0, totalGrossProfit: 0, totalNetProfit: 0, invoiceCount: 0 };

  const handleDownloadValuation = () => {
    const csvRows = [
      ["Category", "Valuation (USD)"],
      ["Gemstones Stock", val.gemstoneValue],
      ["Products Inventory", val.productValue],
      ["Raw Materials", val.materialValue],
      ["Total Assets Valuation", val.totalValue],
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `SR_Takat_Stock_Valuation_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadRevenues = () => {
    const csvRows = [
      ["Metric", "Value (USD)"],
      ["Total Invoice Count", rev.invoiceCount],
      ["Gross Revenue", rev.totalRevenue],
      ["Gross Profit Margins", rev.totalGrossProfit],
      ["Charity Allocations (2%)", rev.totalCharity],
      ["Net Profit", rev.totalNetProfit],
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `SR_Takat_Revenues_Summary_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 font-display">
          Reports
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          Inventory Valuation, Gemstone Stock, Sales, Profit, Charity, Product Cost, and Stock Movement reports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900 font-display text-sm">
            Asset & Stock Valuation Report
          </h3>
          <div className="flex flex-col gap-2.5 text-sm text-gray-600">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>Gemstone Assets:</span>
              <span className="font-semibold text-gray-950">
                ${val.gemstoneValue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>Product Inventory:</span>
              <span className="font-semibold text-gray-950">
                ${val.productValue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>Raw Materials (Metals):</span>
              <span className="font-semibold text-gray-950">
                ${val.materialValue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-gray-900">
              <span>Total Value:</span>
              <span>${val.totalValue.toLocaleString()}</span>
            </div>
          </div>
          <Button onClick={handleDownloadValuation} className="w-full mt-2">
            Download Stock Valuation CSV
          </Button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900 font-display text-sm">
            Revenue & Charity Allocations
          </h3>
          <div className="flex flex-col gap-2.5 text-sm text-gray-600">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>Gross Revenue:</span>
              <span className="font-semibold text-gray-950">
                ${rev.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>Gross Profit Margins:</span>
              <span className="font-semibold text-gray-950">
                ${rev.totalGrossProfit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2 text-rose-600">
              <span>Allocated Charity (2%):</span>
              <span className="font-bold">${rev.totalCharity.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-emerald-600">
              <span>Net Profit:</span>
              <span>${rev.totalNetProfit.toLocaleString()}</span>
            </div>
          </div>
          <Button onClick={handleDownloadRevenues} className="w-full mt-2">
            Download Financial Summary CSV
          </Button>
        </div>
      </div>
    </div>
  );
}

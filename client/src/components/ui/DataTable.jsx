import Spinner from "./Spinner";

export function DataTable({ headers, data, isLoading, emptyMessage = "No items found", renderRow }) {
  return (
    <div className="w-full overflow-x-auto rounded-[20px] border border-gray-100/80 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
      <table className="w-full text-left text-sm text-gray-900 border-collapse">
        <thead className="border-b border-gray-100">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {isLoading ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-16 text-center">
                <div className="flex justify-center items-center gap-3">
                  <Spinner className="h-6 w-6 text-primary" />
                  <span className="text-sm text-gray-400 font-medium">Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-16 text-center text-sm text-gray-400 font-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => renderRow(item, idx))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;

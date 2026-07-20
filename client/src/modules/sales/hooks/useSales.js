import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import salesApi from "../api/salesApi";

export function useSales(params) {
  const queryClient = useQueryClient();

  const salesQuery = useQuery({
    queryKey: ["sales", params],
    queryFn: () => salesApi.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: salesApi.createDirect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });

  return {
    sales: salesQuery.data?.data || [],
    isLoading: salesQuery.isLoading,
    isError: salesQuery.isError,
    createSale: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useSale(id) {
  const salesQuery = useQuery({
    queryKey: ["sale", id],
    queryFn: () => salesApi.getById(id),
    enabled: !!id,
  });

  return {
    sale: salesQuery.data?.data?.sale,
    items: salesQuery.data?.data?.items || [],
    isLoading: salesQuery.isLoading,
    isError: salesQuery.isError,
  };
}

export async function downloadInvoicePdf(id, invoiceNo = "doc") {
  try {
    const response = await salesApi.getPdf(id);
    const rawData = response.data;

    let blob;
    if (rawData instanceof Blob) {
      blob = rawData;
    } else {
      blob = new Blob([rawData], { type: "application/pdf" });
    }

    // Check if error JSON returned inside Blob
    if (blob.type === "application/json") {
      const text = await blob.text();
      const json = JSON.parse(text);
      throw new Error(json.message || "Failed to generate PDF document");
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Invoice-${invoiceNo}.pdf`);
    document.body.appendChild(link);
    link.click();
    if (link.parentNode) link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    if (err?.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || "Failed to download PDF invoice");
      } catch (e) {
        throw new Error(e.message || "Failed to download PDF invoice");
      }
    }
    throw err;
  }
}

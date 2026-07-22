import { useState, useEffect } from "react";
import { Paperclip, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import salesApi from "../api/salesApi";
import { useQueryClient } from "@tanstack/react-query";

export default function RecordPaymentModal({ isOpen, onClose, sale, onSuccess }) {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const total = Number(sale?.total || 0);
  const paid = Number(sale?.amountPaid ?? (sale?.paymentStatus === "Paid" ? total : 0));
  const remainingBalance = Math.max(0, Number(sale?.balanceDue ?? (total - paid)));

  useEffect(() => {
    if (isOpen && sale) {
      setPaymentAmount(remainingBalance > 0 ? remainingBalance.toString() : "");
      setPaymentMethod("Cash");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setAttachments([]);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, sale, remainingBalance]);

  if (!sale) return null;

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            url: event.target.result,
            fileType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const amountNum = Number(paymentAmount);
    if (!paymentAmount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Please enter a valid payment amount greater than $0.";
    } else if (amountNum > remainingBalance + 0.001) {
      newErrors.amount = `Payment amount cannot exceed the remaining balance ($${remainingBalance.toLocaleString()}).`;
    }

    if (!paymentMethod) {
      newErrors.method = "Please select a payment method.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError("Validation Error", "Please correct the payment details highlighted in red.");
      return;
    }

    try {
      setIsSubmitting(true);
      await salesApi.recordPayment({
        saleId: sale._id,
        data: {
          amount: amountNum,
          paymentMethod,
          paymentDate,
          notes,
          attachments,
        },
      });

      showSuccess("Payment Recorded", `Successfully recorded $${amountNum.toLocaleString()} payment for invoice ${sale.invoiceNo}.`);
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sale", sale._id] });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showError("Payment Failed", err?.response?.data?.message || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Payment — Invoice ${sale.invoiceNo}`} className="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Payment Summary Header Cards */}
        <div className="grid grid-cols-3 gap-2 bg-gray-50/80 p-3 rounded-xl border border-gray-200/80 text-xs">
          <div>
            <span className="text-gray-500 block font-medium">Total Sale</span>
            <span className="font-mono font-bold text-gray-900">${total.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500 block font-medium">Already Paid</span>
            <span className="font-mono font-bold text-emerald-700">${paid.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500 block font-medium">Remaining Balance</span>
            <span className="font-mono font-bold text-rose-700">${remainingBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Customer Details */}
        <div className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-gray-200 flex justify-between items-center">
          <span>Customer: <strong className="text-gray-900">{sale.customerId?.fullName || "Walk-in Client"}</strong></span>
          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
            sale.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : sale.paymentStatus === "Partially Paid" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
          }`}>
            {sale.paymentStatus || "Unpaid"}
          </span>
        </div>

        {/* Amount Input */}
        <div>
          <Input
            label="Payment Amount ($) *"
            type="number"
            step="0.01"
            max={remainingBalance}
            value={paymentAmount}
            onChange={(e) => {
              setPaymentAmount(e.target.value);
              setErrors((prev) => ({ ...prev, amount: null }));
            }}
            placeholder={`Max $${remainingBalance}`}
            required
          />
          {errors.amount && <p className="text-xs font-semibold text-rose-600 mt-1">{errors.amount}</p>}
        </div>

        {/* Payment Method & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Payment Method *"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: "Cash", label: "Cash" },
              { value: "Credit Card", label: "Credit Card" },
              { value: "Bank Transfer", label: "Bank Transfer" },
              { value: "Cheque", label: "Cheque" },
              { value: "Crypto", label: "Crypto" },
              { value: "Other", label: "Other" },
            ]}
          />
          <Input
            label="Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        {/* Payment Notes */}
        <Textarea
          label="Payment Notes / Transaction Ref"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Bank transfer ref #TXN98402, installment 2..."
          rows={2}
        />

        {/* Attach Supporting Documents / Images */}
        <div className="space-y-2 bg-gray-50/70 p-3 rounded-lg border border-gray-200">
          <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Paperclip className="h-4 w-4 text-primary" /> Attach Supporting Document / Receipt Image
            </span>
            <span className="text-[11px] font-normal text-gray-500">Optional</span>
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileUpload}
            className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
          />

          {attachments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative group rounded-md border border-gray-200 p-1.5 bg-white text-xs flex items-center gap-1.5 overflow-hidden">
                  {att.fileType?.startsWith("image/") ? (
                    <img src={att.url} alt={att.name} className="h-7 w-7 object-cover rounded" />
                  ) : (
                    <FileText className="h-6 w-6 text-primary shrink-0" />
                  )}
                  <span className="truncate text-[11px] font-medium flex-1 text-gray-700">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    className="text-rose-600 hover:bg-rose-50 p-1 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || remainingBalance <= 0}>
            Submit Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

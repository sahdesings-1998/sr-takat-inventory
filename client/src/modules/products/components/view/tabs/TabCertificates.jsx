import { ShieldCheck, ExternalLink, Download } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

function hasValue(val) {
  return val !== null && val !== undefined && val !== "";
}

function Field({ label, value }) {
  if (!hasValue(value)) return null;
  return (
    <div className="group p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-200">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="block mt-1 text-sm font-semibold text-gray-800 break-words">{String(value)}</span>
    </div>
  );
}

const LAB_VARIANTS = {
  GIA: "primary",
  GRS: "success",
  AGL: "info",
  Gübelin: "accent",
  SSEF: "warning",
};

export default function TabCertificates({ product, onPreviewDoc }) {
  const hasCert = product?.certificateAvailable === true || product?.certificateAvailable === "true";
  const labVariant = LAB_VARIANTS[product?.laboratory] || "neutral";

  return (
    <div className="space-y-5">
      {/* Certificate Status Banner */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${hasCert ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
        <ShieldCheck className={`h-6 w-6 shrink-0 ${hasCert ? "text-emerald-600" : "text-gray-400"}`} />
        <div>
          <p className={`text-sm font-bold ${hasCert ? "text-emerald-800" : "text-gray-600"}`}>
            {hasCert ? "Certificate Available" : "No Certificate"}
          </p>
          <p className={`text-xs ${hasCert ? "text-emerald-600" : "text-gray-400"}`}>
            {hasCert
              ? `Certified by ${product?.laboratory || "a grading laboratory"}`
              : "No grading certificate has been issued for this product."}
          </p>
        </div>
        {product?.laboratory && (
          <Badge variant={labVariant} className="ml-auto">{product.laboratory}</Badge>
        )}
      </div>

      {hasCert && (
        <>
          {/* Certificate Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 pl-3 border-l-[3px] border-emerald-400/60 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
                <h3 className="font-semibold text-gray-900 text-sm">Certificate Details</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Certificate Number" value={product?.certificateNumber} />
                <Field label="Laboratory" value={product?.laboratory} />
                <Field label="Certificate Date" value={product?.certificateDate?.slice(0, 10)} />
                <Field label="Certificate Cost" value={product?.certificateCost ? `$${product.certificateCost.toLocaleString()}` : null} />
                {product?.certificateNotes && (
                  <div className="p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 sm:col-span-2 lg:col-span-3">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Certificate Notes</span>
                    <span className="block mt-1 text-sm text-gray-700 leading-relaxed">{product.certificateNotes}</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Certificate PDF */}
          {hasValue(product?.certificatePdf) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 pl-3 border-l-[3px] border-primary/50 text-primary">
                  <Download className="h-4 w-4" />
                  <h3 className="font-semibold text-gray-900 text-sm">Certificate Documents</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                {hasValue(product?.certificatePdf) && (
                  <button
                    type="button"
                    onClick={() => onPreviewDoc(product.certificatePdf, "Certificate Report PDF", "PDF Document")}
                    className="flex items-center gap-4 w-full p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-200 transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium">Certificate PDF Report</p>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors truncate">
                        {product?.laboratory} — {product?.certificateNumber || "Certificate"}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                  </button>
                )}

                {hasValue(product?.certificateImages) && (
                  <button
                    type="button"
                    onClick={() => onPreviewDoc(product.certificateImages, "Certificate Image", "Image")}
                    className="flex items-center gap-4 w-full p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium">Certificate Image</p>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
                        View Certificate Scan
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                  </button>
                )}
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

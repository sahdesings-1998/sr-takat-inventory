import { FolderOpen, FileText, ShieldCheck, Award, Wrench, ExternalLink } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";

function hasValue(val) {
  return val !== null && val !== undefined && val !== "";
}

function DocItem({ icon: Icon, badgeLabel, title, subtitle, url, onPreview, colorClass }) {
  if (!hasValue(url)) return null;
  return (
    <button
      type="button"
      onClick={() => onPreview(url, title, "Document")}
      className={`flex items-center gap-4 w-full p-4 rounded-2xl border transition-all group text-left ${colorClass}`}
    >
      <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{badgeLabel}</p>
        <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors truncate">{subtitle}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
    </button>
  );
}

function DocGroup({ icon: Icon, title, accentClass, children }) {
  const hasChildren = Array.isArray(children)
    ? children.some(Boolean)
    : Boolean(children);
  if (!hasChildren) return null;

  return (
    <Card>
      <CardHeader>
        <div className={`flex items-center gap-2 pl-3 border-l-[3px] ${accentClass}`}>
          <Icon className="h-4 w-4" />
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">{children}</CardBody>
    </Card>
  );
}

export default function TabDocuments({ product, onPreviewDoc }) {
  const hasDocs = hasValue(product?.documents) || hasValue(product?.certificatePdf) ||
    hasValue(product?.warranty) || hasValue(product?.cadFiles) || hasValue(product?.certificateImages);

  if (!hasDocs) {
    return (
      <Card>
        <CardBody>
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <FolderOpen className="h-8 w-8 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No Documents Uploaded</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Purchase documents, certificates, warranty, and CAD files will appear here.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <DocGroup
        icon={ShieldCheck}
        title="Certificates"
        accentClass="border-emerald-400/60 text-emerald-600"
      >
        <DocItem
          icon={ShieldCheck}
          badgeLabel="Certificate PDF"
          title="Certificate PDF Report"
          subtitle={`${product?.laboratory || "Lab"} — ${product?.certificateNumber || "Certificate Report"}`}
          url={product?.certificatePdf}
          onPreview={onPreviewDoc}
          colorClass="border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50"
        />
        <DocItem
          icon={FileText}
          badgeLabel="Certificate Image"
          title="Certificate Image"
          subtitle="Certificate scan / photo"
          url={product?.certificateImages}
          onPreview={onPreviewDoc}
          colorClass="border-teal-100 bg-teal-50/50 hover:bg-teal-50"
        />
      </DocGroup>

      <DocGroup
        icon={Award}
        title="Warranty"
        accentClass="border-amber-400/60 text-amber-600"
      >
        <DocItem
          icon={Award}
          badgeLabel="Warranty Document"
          title="Warranty"
          subtitle="View warranty document"
          url={product?.warranty}
          onPreview={onPreviewDoc}
          colorClass="border-amber-100 bg-amber-50/50 hover:bg-amber-50"
        />
      </DocGroup>

      <DocGroup
        icon={Wrench}
        title="CAD & Design Files"
        accentClass="border-violet-400/60 text-violet-600"
      >
        <DocItem
          icon={Wrench}
          badgeLabel="CAD File"
          title="CAD / 3D Design File"
          subtitle="Download CAD model"
          url={product?.cadFiles}
          onPreview={onPreviewDoc}
          colorClass="border-violet-100 bg-violet-50/50 hover:bg-violet-50"
        />
      </DocGroup>

      <DocGroup
        icon={FolderOpen}
        title="Other Documents"
        accentClass="border-gray-400/60 text-gray-600"
      >
        <DocItem
          icon={FileText}
          badgeLabel="Document"
          title="Attachment"
          subtitle="View attachment"
          url={product?.documents}
          onPreview={onPreviewDoc}
          colorClass="border-gray-100 bg-gray-50/50 hover:bg-gray-50"
        />
      </DocGroup>
    </div>
  );
}

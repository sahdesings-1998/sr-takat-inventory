import { useState } from "react";
import { Image, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";

function hasValue(val) {
  return val !== null && val !== undefined && val !== "";
}

function ImageLightbox({ images, initialIdx, onClose }) {
  const [current, setCurrent] = useState(initialIdx);
  const prev = () => setCurrent((c) => (c > 0 ? c - 1 : images.length - 1));
  const next = () => setCurrent((c) => (c < images.length - 1 ? c + 1 : 0));

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>
      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <img
        src={images[current]}
        alt={`Image ${current + 1}`}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="absolute bottom-4 text-white/60 text-sm font-medium">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}

export default function TabMedia({ product, onPreviewDoc }) {
  const [lightbox, setLightbox] = useState({ open: false, images: [], idx: 0 });
  const images = product?.imageUrls || [];

  return (
    <div className="space-y-0">
      {/* Image Gallery */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 pl-3 border-l-[3px] border-primary/50 text-primary">
              <Image className="h-4 w-4" />
              <h3 className="font-semibold text-gray-900 text-sm">
                Product Gallery
                <span className="ml-2 text-[10px] font-medium text-gray-400">({images.length} image{images.length !== 1 ? "s" : ""})</span>
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => setLightbox({ open: true, images, idx })}
                >
                  <img
                    src={url}
                    alt={`Product image ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full">
                      View
                    </span>
                  </div>
                  {idx === 0 && (
                    <div className="absolute top-2 left-2">
                      <span className="text-[9px] font-bold text-white bg-primary rounded-md px-1.5 py-0.5">MAIN</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Videos */}
      {hasValue(product?.videos) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 pl-3 border-l-[3px] border-rose-400/60 text-rose-600">
              <Play className="h-4 w-4" />
              <h3 className="font-semibold text-gray-900 text-sm">Video</h3>
            </div>
          </CardHeader>
          <CardBody>
            <button
              type="button"
              onClick={() => onPreviewDoc(product.videos, "Product Video", "Video")}
              className="flex items-center gap-4 w-full p-4 rounded-2xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                <Play className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Product Video</p>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
                  Play Video
                </p>
              </div>
            </button>
          </CardBody>
        </Card>
      )}

      {/* No media fallback */}
      {images.length === 0 && !hasValue(product?.videos) && (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Image className="h-8 w-8 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500">No Media Available</p>
              <p className="text-xs text-gray-400 max-w-xs">
                No images or videos have been uploaded for this product.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Lightbox */}
      {lightbox.open && (
        <ImageLightbox
          images={lightbox.images}
          initialIdx={lightbox.idx}
          onClose={() => setLightbox({ open: false, images: [], idx: 0 })}
        />
      )}
    </div>
  );
}

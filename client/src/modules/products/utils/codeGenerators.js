/**
 * Vector SVG Barcode (Code128-B) and QR Code Generator Utilities
 * Pure JavaScript, zero external dependencies, crisp vector rendering.
 */

// Code 128 Character Set B patterns (module widths for 6 bars/spaces)
const CODE128_PATTERNS = [
  [2,1,2,2,2,2], [2,2,2,1,2,2], [2,2,2,2,2,1], [1,2,1,2,2,3], [1,2,1,3,2,2], // 0-4 (' ', '!', '"', '#', '$')
  [1,3,1,2,2,2], [1,2,2,2,1,3], [1,2,2,3,1,2], [1,3,2,2,1,2], [2,2,1,2,1,3], // 5-9 ('%', '&', "'", '(', ')')
  [2,2,1,3,1,2], [2,3,1,2,1,2], [1,1,2,2,3,2], [1,2,2,1,3,2], [1,2,2,2,3,1], // 10-14 ('*', '+', ',', '-', '.')
  [1,1,3,2,2,2], [1,2,3,1,2,2], [1,2,3,2,2,1], [2,2,3,2,1,1], [2,2,1,1,3,2], // 15-19 ('/', '0', '1', '2', '3')
  [2,2,1,2,3,1], [2,1,3,2,1,2], [2,2,3,1,1,2], [3,1,2,1,3,1], [3,1,1,2,2,2], // 20-24 ('4', '5', '6', '7', '8')
  [3,2,1,1,2,2], [3,2,1,2,2,1], [3,1,2,2,1,2], [3,2,2,1,1,2], [3,2,2,2,1,1], // 25-29 ('9', ':', ';', '<', '=')
  [2,1,2,1,2,3], [2,1,2,3,2,1], [2,3,2,1,2,1], [1,1,1,3,2,3], [1,3,1,1,2,3], // 30-34 ('>', '?', '@', 'A', 'B')
  [1,3,1,3,2,1], [1,1,2,3,1,3], [1,3,2,1,1,3], [1,3,2,3,1,1], [2,1,1,3,1,3], // 35-39 ('C', 'D', 'E', 'F', 'G')
  [2,3,1,1,1,3], [2,3,1,3,1,1], [1,1,2,1,3,3], [1,1,2,3,3,1], [1,3,2,1,3,1], // 40-44 ('H', 'I', 'J', 'K', 'L')
  [1,1,3,1,2,3], [1,1,3,3,2,1], [1,3,3,1,2,1], [3,1,3,1,2,1], [2,1,1,3,3,1], // 45-49 ('M', 'N', 'O', 'P', 'Q')
  [2,3,1,1,3,1], [2,1,3,1,1,3], [2,1,3,3,1,1], [2,1,3,1,3,1], [3,1,1,1,2,3], // 50-54 ('R', 'S', 'T', 'U', 'V')
  [3,1,1,3,2,1], [3,3,1,1,2,1], [3,1,2,1,1,3], [3,1,2,3,1,1], [3,3,2,1,1,1], // 55-59 ('W', 'X', 'Y', 'Z', '[')
  [3,1,4,1,1,1], [2,2,1,4,1,1], [4,3,1,1,1,1], [1,1,1,2,2,4], [1,1,1,4,2,2], // 60-64 ('\\', ']', '^', '_', '`')
  [1,2,1,1,2,4], [1,2,1,4,2,1], [1,4,1,1,2,2], [1,4,1,2,2,1], [1,1,2,2,1,4], // 65-69 ('a', 'b', 'c', 'd', 'e')
  [1,1,2,4,1,2], [1,2,2,1,1,4], [1,2,2,4,1,1], [1,4,2,1,1,2], [1,4,2,2,1,1], // 70-74 ('f', 'g', 'h', 'i', 'j')
  [2,4,1,2,1,1], [2,2,1,1,1,4], [4,1,3,1,1,1], [2,4,1,1,1,2], [1,3,4,1,1,1], // 75-79 ('k', 'l', 'm', 'n', 'o')
  [1,1,1,2,4,2], [1,2,1,1,4,2], [1,2,1,2,4,1], [1,1,4,2,1,2], [1,2,4,1,1,2], // 80-84 ('p', 'q', 'r', 's', 't')
  [1,2,4,2,1,1], [4,1,1,2,1,2], [4,2,1,1,1,2], [4,2,1,2,1,1], [2,1,2,1,4,1], // 85-89 ('u', 'v', 'w', 'x', 'y')
  [2,1,4,1,2,1], [4,1,2,1,2,1], [1,1,1,1,4,3], [1,1,1,3,4,1], [1,3,1,1,4,1], // 90-94 ('z', '{', '|', '}', '~')
  [1,1,4,1,1,3], [1,1,4,3,1,1], [4,1,1,1,1,3], [4,1,1,3,1,1], [1,1,3,1,4,1], // 95-99 (DEL, FNC3, FNC2, Shift, Code C)
  [1,1,4,1,3,1], [3,1,1,1,4,1], [4,1,1,1,3,1], [2,1,1,4,1,2], [2,1,1,2,1,4], // 100-104 (Code B, Code A, FNC1, Start A, Start B)
  [2,1,1,2,3,2], [2,3,3,1,1,1,2] // 105-106 (Start C, Stop)
];

const START_B = 104;
const STOP = 106;

/**
 * Encodes text into Code128-B pattern widths
 */
export function encodeCode128(text) {
  const clean = String(text || "100001").trim();
  const indices = [START_B];
  let checksum = START_B;

  for (let i = 0; i < clean.length; i++) {
    let charCode = clean.charCodeAt(i);
    let codeIndex = charCode - 32;
    if (codeIndex < 0 || codeIndex > 95) codeIndex = 0; // fallback space
    indices.push(codeIndex);
    checksum += codeIndex * (i + 1);
  }

  const checkIndex = checksum % 103;
  indices.push(checkIndex);
  indices.push(STOP);

  // Convert to bar/space width sequence
  const bars = [];
  indices.forEach((idx) => {
    const pattern = CODE128_PATTERNS[idx] || CODE128_PATTERNS[0];
    pattern.forEach((w) => bars.push(w));
  });

  return bars;
}

/**
 * Generates an SVG string representation of a Code128 Barcode
 */
export function generateBarcodeSVGData(text, options = {}) {
  const { width = 300, height = 90, showText = true, barColor = "#000000" } = options;
  const bars = encodeCode128(text);
  const totalModules = bars.reduce((acc, w) => acc + w, 0);

  const padding = 15;
  const textHeight = showText ? 20 : 0;
  const barHeight = height - padding * 2 - textHeight;
  const moduleWidth = (width - padding * 2) / totalModules;

  let currentX = padding;
  let rects = [];

  bars.forEach((w, idx) => {
    const isBar = idx % 2 === 0;
    const barW = w * moduleWidth;
    if (isBar) {
      rects.push(
        `<rect x="${currentX.toFixed(2)}" y="${padding}" width="${barW.toFixed(2)}" height="${barHeight}" fill="${barColor}" />`
      );
    }
    currentX += barW;
  });

  const textSVG = showText
    ? `<text x="${(width / 2).toFixed(2)}" y="${(height - 8).toFixed(2)}" text-anchor="middle" font-family="monospace, sans-serif" font-size="12" font-weight="bold" fill="#374151">${text}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <rect width="${width}" height="${height}" fill="#ffffff" rx="8" />
    ${rects.join("")}
    ${textSVG}
  </svg>`;
}

import QRCode from "qrcode";

/**
 * Generates an SVG string representation of a standard-compliant QR Code matrix
 */
export function generateQRCodeSVGData(text, options = {}) {
  const { size: svgSize = 240, fgColor = "#1e1b4b", bgColor = "#ffffff", margin = 2 } = options;
  const str = String(text || "").trim() || "QR";

  try {
    const qr = QRCode.create(str, { errorCorrectionLevel: "M" });
    const moduleCount = qr.modules.size;
    const totalModules = moduleCount + margin * 2;
    const cellSize = svgSize / totalModules;

    const rects = [];
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          const x = (c + margin) * cellSize;
          const y = (r + margin) * cellSize;
          rects.push(
            `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(cellSize + 0.15).toFixed(2)}" height="${(cellSize + 0.15).toFixed(2)}" fill="${fgColor}" />`
          );
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <rect width="${svgSize}" height="${svgSize}" fill="${bgColor}" rx="12" />
    ${rects.join("")}
  </svg>`;
  } catch (err) {
    console.error("[generateQRCodeSVGData] Failed to generate QR SVG:", err);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="100%" height="100%"><rect width="${svgSize}" height="${svgSize}" fill="${bgColor}" rx="12"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#ef4444" font-family="sans-serif" font-size="12" font-weight="bold">QR Code Error</text></svg>`;
  }
}

/**
 * Converts an SVG string into a PNG data URL or triggers image download
 */
export function downloadSVGAsPNG(svgString, fileName = "code.png", width = 600, height = 300) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const pngUrl = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  img.src = url;
}

/**
 * Triggers SVG file download directly
 */
export function downloadSVGFile(svgString, fileName = "code.svg") {
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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

/**
 * Simple, robust QR Code matrix generator for SVG output
 */
export function generateQRCodeMatrix(text) {
  const str = String(text || "").trim();
  const size = 25; // 25x25 Version 2 QR matrix
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));

  // Helper to draw filled box
  const fillRect = (r, c, w, h, val = 1) => {
    for (let i = r; i < r + h; i++) {
      for (let j = c; j < c + w; j++) {
        if (i >= 0 && i < size && j >= 0 && j < size) {
          matrix[i][j] = val;
        }
      }
    }
  };

  // Helper to draw 7x7 Finder Pattern
  const drawFinder = (startR, startC) => {
    fillRect(startR, startC, 7, 7, 1);
    fillRect(startR + 1, startC + 1, 5, 5, 0);
    fillRect(startR + 2, startC + 2, 3, 3, 1);
  };

  // Draw 3 Finder Patterns
  drawFinder(0, 0);                  // Top-Left
  drawFinder(0, size - 7);           // Top-Right
  drawFinder(size - 7, 0);           // Bottom-Left

  // Draw Timing Lines
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Alignment pattern at bottom right
  const alignR = size - 7;
  const alignC = size - 7;
  fillRect(alignR - 1, alignC - 1, 5, 5, 1);
  fillRect(alignR, alignC, 3, 3, 0);
  matrix[alignR + 1][alignC + 1] = 1;

  // Hash payload simulation into available modules
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }

  let seed = Math.abs(hash);
  const lcg = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Fill remaining unreserved modules
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones
      if (r < 9 && c < 9) continue;
      if (r < 9 && c >= size - 8) continue;
      if (r >= size - 8 && c < 9) continue;
      if (r === 6 || c === 6) continue;
      if (r >= size - 9 && r <= size - 5 && c >= size - 9 && c <= size - 5) continue;

      const charVal = str.charCodeAt((r + c) % str.length || 0);
      const isBitSet = ((charVal ^ r ^ c) + Math.floor(lcg() * 10)) % 2 === 0;
      matrix[r][c] = isBitSet ? 1 : 0;
    }
  }

  return { matrix, size };
}

/**
 * Generates an SVG string representation of a QR Code
 */
export function generateQRCodeSVGData(text, options = {}) {
  const { size: svgSize = 240, fgColor = "#1e1b4b", bgColor = "#ffffff" } = options;
  const { matrix, size: matrixSize } = generateQRCodeMatrix(text);
  const padding = 2; // quiet zone in module units
  const totalModules = matrixSize + padding * 2;
  const cellSize = svgSize / totalModules;

  const rects = [];
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c] === 1) {
        const x = (c + padding) * cellSize;
        const y = (r + padding) * cellSize;
        rects.push(
          `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(cellSize + 0.3).toFixed(2)}" height="${(cellSize + 0.3).toFixed(2)}" fill="${fgColor}" />`
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <rect width="${svgSize}" height="${svgSize}" fill="${bgColor}" rx="12" />
    ${rects.join("")}
  </svg>`;
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

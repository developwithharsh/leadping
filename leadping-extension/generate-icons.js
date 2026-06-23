/**
 * Run once: node generate-icons.js
 * Creates icons/icon16.png, icon32.png, icon48.png, icon128.png
 * Pure Node.js — no external dependencies needed.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size) {
  const width = size;
  const height = size;
  const pixels = new Uint8Array(width * height * 4);

  function setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const i = (y * width + x) * 4;
    pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = a;
  }

  function fillCircle(cx, cy, radius, r, g, b, a) {
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist <= radius) {
          const alpha = dist > radius - 1 ? Math.round((radius - dist) * a) : a;
          setPixel(x, y, r, g, b, alpha);
        }
      }
    }
  }

  function fillRect(x1, y1, x2, y2, r, g, b, a) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        setPixel(x, y, r, g, b, a);
      }
    }
  }

  function drawLine(x0, y0, x1, y1, thickness, r, g, b, a) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 4;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x0 + (x1 - x0) * t;
      const py = y0 + (y1 - y0) * t;
      const half = thickness / 2;
      for (let dy = -Math.ceil(half); dy <= Math.ceil(half); dy++) {
        for (let dx = -Math.ceil(half); dx <= Math.ceil(half); dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= half) {
            const alpha = dist > half - 1 ? Math.round((half - dist) * a) : a;
            setPixel(Math.round(px + dx), Math.round(py + dy), r, g, b, alpha);
          }
        }
      }
    }
  }

  const cx = width / 2;
  const cy = height / 2;
  const r = size * 0.46;

  // Background circle gradient (deep blue to medium blue)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= r) {
        const t = dist / r;
        const rr = Math.round(12 + (24 - 12) * t);
        const gg = Math.round(45 + (95 - 45) * t);
        const bb = Math.round(94 + (165 - 94) * t);
        const edgeAlpha = dist > r - 1.5 ? Math.round(255 * (r - dist) / 1.5) : 255;
        setPixel(x, y, rr, gg, bb, edgeAlpha);
      }
    }
  }

  // Lightning bolt (⚡) — scaled to icon size
  const s = size / 128;
  // Bolt is drawn as a polygon approximated with thick lines
  // Top part: from top-right going down-left to middle
  // Bottom part: from middle going down-right to bottom-left
  const thick = Math.max(2, size * 0.13);
  const thickInner = Math.max(1.5, size * 0.09);

  // Outer bolt points (scaled from 128px base)
  const boltPts = [
    [72 * s, 14 * s],   // top right
    [44 * s, 60 * s],   // middle left top
    [58 * s, 60 * s],   // middle right top
    [38 * s, 114 * s],  // bottom left
    [74 * s, 65 * s],   // middle right bottom
    [60 * s, 65 * s],   // middle left bottom
    [72 * s, 14 * s],   // close
  ];

  // Fill bolt with white — rasterize as filled polygon
  const minY = Math.floor(Math.min(...boltPts.map(p => p[1])));
  const maxY = Math.ceil(Math.max(...boltPts.map(p => p[1])));

  for (let y = minY; y <= maxY; y++) {
    const intersections = [];
    for (let i = 0; i < boltPts.length - 1; i++) {
      const [x0, y0] = boltPts[i];
      const [x1, y1] = boltPts[i + 1];
      if ((y0 <= y && y < y1) || (y1 <= y && y < y0)) {
        const x = x0 + (y - y0) * (x1 - x0) / (y1 - y0);
        intersections.push(x);
      }
    }
    intersections.sort((a, b) => a - b);
    for (let k = 0; k < intersections.length - 1; k += 2) {
      const xStart = Math.floor(intersections[k]);
      const xEnd = Math.ceil(intersections[k + 1]);
      for (let x = xStart; x <= xEnd; x++) {
        const edgeDist = Math.min(x - intersections[k], intersections[k+1] - x, 1);
        const alpha = Math.round(255 * Math.min(edgeDist, 1));
        const existing = (y * width + x) * 4;
        if (pixels[existing + 3] > 0) {
          setPixel(x, y, 255, 235, 59, Math.max(alpha, 220));
        }
      }
    }
  }

  // Yellow outline / glow on bolt
  for (let y = minY - 2; y <= maxY + 2; y++) {
    const intersections = [];
    const scaledPts = boltPts.map(([x, py]) => [x, py]);
    for (let i = 0; i < scaledPts.length - 1; i++) {
      const [x0, y0] = scaledPts[i];
      const [x1, y1] = scaledPts[i + 1];
      if ((y0 <= y && y < y1) || (y1 <= y && y < y0)) {
        const x = x0 + (y - y0) * (x1 - x0) / (y1 - y0);
        intersections.push(x);
      }
    }
    intersections.sort((a, b) => a - b);
    for (let k = 0; k < intersections.length - 1; k += 2) {
      const xStart = Math.floor(intersections[k]) - 1;
      const xEnd = Math.ceil(intersections[k + 1]) + 1;
      for (let x = xStart; x <= xEnd; x++) {
        const i = (y * width + x) * 4;
        if (x >= 0 && x < width && y >= 0 && y < height && pixels[i + 3] < 100) {
          setPixel(x, y, 255, 220, 0, 60);
        }
      }
    }
  }

  // Build PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBytes, data]);
    const crc = crc32(crcData);
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, typeBytes, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB (we'll use RGBA=6)
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // IDAT
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    rawRows.push(0); // filter type none
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rawRows.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]);
    }
  }
  const raw = Buffer.from(rawRows);
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', iend),
  ]);
}

function crc32(buf) {
  const table = makeCrcTable();
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeCrcTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

[16, 32, 48, 128].forEach(size => {
  const png = createPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`✅ Created icons/icon${size}.png`);
});

console.log('\n🎉 Icons generated! Load the extension in Chrome now.');

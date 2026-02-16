/**
 * Generate PNG icons for PWA manifest.
 * Uses Node.js built-in zlib for PNG compression.
 *
 * Usage: node scripts/generate-icons.js
 */
const { deflateSync } = require('zlib');
const { writeFileSync } = require('fs');
const { join } = require('path');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function createPNG(size) {
  const w = size, h = size;
  // Blue (#1e40af) rounded-rect background with white "B" letter
  const bgR = 30, bgG = 64, bgB = 175;
  const fgR = 255, fgG = 255, fgB = 255;

  const cornerR = Math.round(size * 0.16);
  const raw = Buffer.alloc(h * (1 + w * 4)); // filter byte + RGBA per row

  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter: None
    for (let x = 0; x < w; x++) {
      const idx = y * (1 + w * 4) + 1 + x * 4;
      const inBg = inRoundedRect(x, y, w, h, cornerR);
      const inLetter = inPesoB(x, y, w, h);

      if (inBg && inLetter) {
        raw[idx] = fgR; raw[idx+1] = fgG; raw[idx+2] = fgB; raw[idx+3] = 255;
      } else if (inBg) {
        raw[idx] = bgR; raw[idx+1] = bgG; raw[idx+2] = bgB; raw[idx+3] = 255;
      } else {
        raw[idx] = 0; raw[idx+1] = 0; raw[idx+2] = 0; raw[idx+3] = 0;
      }
    }
  }

  const compressed = deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function inRoundedRect(x, y, w, h, cr) {
  if (x < 0 || x >= w || y < 0 || y >= h) return false;
  // Check corners
  const checks = [
    [cr, cr],           // top-left
    [w - cr, cr],       // top-right
    [cr, h - cr],       // bottom-left
    [w - cr, h - cr],   // bottom-right
  ];
  for (const [ccx, ccy] of checks) {
    const inCorner = (x < cr && y < cr) || (x >= w-cr && y < cr) ||
                     (x < cr && y >= h-cr) || (x >= w-cr && y >= h-cr);
    if (inCorner) {
      const dx = x - ccx, dy = y - ccy;
      if (dx*dx + dy*dy > cr*cr) return false;
    }
  }
  return true;
}

function inPesoB(x, y, w, h) {
  // Draw a bold "B" shape representing "Budget" — centered
  const s = w; // icon size
  const cx = s * 0.5;
  const cy = s * 0.5;
  const sw = s * 0.06; // stroke width

  // Vertical stem on left
  const stemL = cx - s * 0.15;
  const stemT = cy - s * 0.25;
  const stemBot = cy + s * 0.25;
  if (x >= stemL - sw/2 && x <= stemL + sw/2 && y >= stemT && y <= stemBot) return true;

  // Top bump of B (semicircle)
  const bump1Cx = stemL + s * 0.05;
  const bump1Cy = cy - s * 0.12;
  const bump1R = s * 0.14;
  const d1 = Math.sqrt((x-bump1Cx)**2 + (y-bump1Cy)**2);
  if (d1 >= bump1R - sw/2 && d1 <= bump1R + sw/2 && x >= stemL && y >= stemT && y <= cy) return true;

  // Bottom bump of B (semicircle, slightly larger)
  const bump2Cx = stemL + s * 0.05;
  const bump2Cy = cy + s * 0.12;
  const bump2R = s * 0.14;
  const d2 = Math.sqrt((x-bump2Cx)**2 + (y-bump2Cy)**2);
  if (d2 >= bump2R - sw/2 && d2 <= bump2R + sw/2 && x >= stemL && y >= cy && y <= stemBot) return true;

  // Top horizontal
  if (y >= stemT - sw/2 && y <= stemT + sw/2 && x >= stemL && x <= bump1Cx) return true;
  // Middle horizontal
  if (y >= cy - sw/2 && y <= cy + sw/2 && x >= stemL && x <= bump2Cx) return true;
  // Bottom horizontal
  if (y >= stemBot - sw/2 && y <= stemBot + sw/2 && x >= stemL && x <= bump2Cx) return true;

  return false;
}

// Generate
[192, 512].forEach(size => {
  const png = createPNG(size);
  const out = join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.png`);
  writeFileSync(out, png);
  console.log(`Generated icon-${size}x${size}.png (${png.length} bytes)`);
});

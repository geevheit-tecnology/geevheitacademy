/**
 * Gerador de Payload Pix no padrão BR Code / EMVCo do Banco Central do Brasil
 * e codificador de QR Code SVG independente (zero dependências).
 */

function normalizeText(text: string, maxLen: number): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .trim()
    .slice(0, maxLen);
}

function emvField(id: string, value: string): string {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface PixPayloadParams {
  key: string;
  name: string;
  city?: string;
  amount?: number; // em Reais (ex: 49.90)
  txid?: string;
}

export function generatePixPayload({
  key,
  name,
  city = "SAO PAULO",
  amount,
  txid = "***",
}: PixPayloadParams): string {
  const cleanKey = (key || "").trim();
  const cleanName = normalizeText(name, 25) || "RECEBEDOR";
  const cleanCity = normalizeText(city, 15) || "SAO PAULO";
  const cleanTxid = normalizeText(txid, 25) || "***";

  const merchantAccount =
    emvField("00", "br.gov.bcb.pix") + emvField("01", cleanKey);
  const additionalData = emvField("05", cleanTxid);

  let raw =
    emvField("00", "01") +
    emvField("26", merchantAccount) +
    emvField("52", "0000") +
    emvField("53", "986");

  if (amount && amount > 0) {
    raw += emvField("54", amount.toFixed(2));
  }

  raw +=
    emvField("58", "BR") +
    emvField("59", cleanName) +
    emvField("60", cleanCity) +
    emvField("62", additionalData) +
    "6304";

  return raw + crc16(raw);
}

// -------------------------------------------------------------
// Gerador de QR Code em SVG Puro (Padrão ISO/IEC 18004, EC Level L)
// -------------------------------------------------------------

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
let gfVal = 1;
for (let i = 0; i < 255; i++) {
  EXP[i] = gfVal;
  LOG[gfVal] = i;
  gfVal = (gfVal << 1) ^ (gfVal >= 128 ? 0x11d : 0);
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];

function gmul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsPoly(n: number): number[] {
  let p = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(p.length + 1).fill(0);
    for (let j = 0; j < p.length; j++) {
      next[j] ^= gmul(p[j], EXP[i]);
      next[j + 1] ^= p[j];
    }
    p = next;
  }
  return p;
}

function rsRemainder(data: number[], poly: number[]): number[] {
  const result = new Array(poly.length - 1).fill(0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() ?? 0);
    result.push(0);
    for (let i = 0; i < poly.length - 1; i++) {
      result[i] ^= gmul(poly[i], factor);
    }
  }
  return result;
}

// Versões suportadas: 1 a 12 (EC Level L)
// [totalCodewords, ecPerBlock, numBlocksG1, dataPerBlockG1, numBlocksG2, dataPerBlockG2]
const VERSION_TABLE_L: Array<[number, number, number, number, number, number] | null> = [
  null,
  [26, 7, 1, 19, 0, 0],
  [44, 10, 1, 34, 0, 0],
  [70, 15, 1, 55, 0, 0],
  [100, 20, 1, 80, 0, 0],
  [134, 26, 1, 108, 0, 0],
  [172, 18, 2, 68, 0, 0],
  [196, 20, 2, 78, 0, 0],
  [242, 24, 2, 97, 0, 0],
  [292, 30, 2, 116, 0, 0],
  [346, 18, 2, 68, 2, 69],
  [404, 20, 4, 81, 0, 0],
  [466, 24, 2, 92, 2, 93],
];

const ALIGNMENT_PATTERN_POS: number[][] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
];

export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  let version = 1;
  while (version < VERSION_TABLE_L.length) {
    const info = VERSION_TABLE_L[version]!;
    const totalData = info[2] * info[3] + info[4] * info[5];
    const headerBits = 4 + (version <= 9 ? 8 : 16);
    if (bytes.length * 8 + headerBits <= totalData * 8) break;
    version++;
  }
  if (version >= VERSION_TABLE_L.length) {
    throw new Error("Texto muito longo para o gerador de QR Code.");
  }

  const info = VERSION_TABLE_L[version]!;
  const totalDataBytes = info[2] * info[3] + info[4] * info[5];

  const bits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  }

  // Byte mode
  pushBits(0b0100, 4);
  pushBits(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) pushBits(b, 8);

  // Terminador e preenchimento
  const maxBits = totalDataBytes * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const padBytes = [0xec, 0x11];
  let pIdx = 0;
  while (bits.length < maxBits) {
    pushBits(padBytes[pIdx % 2], 8);
    pIdx++;
  }

  const dataBytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    dataBytes.push(b);
  }

  const ecLen = info[1];
  const poly = rsPoly(ecLen);
  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];

  let offset = 0;
  for (let i = 0; i < info[2]; i++) {
    const blk = dataBytes.slice(offset, offset + info[3]);
    offset += info[3];
    blocks.push(blk);
    ecBlocks.push(rsRemainder(blk, poly));
  }
  for (let i = 0; i < info[4]; i++) {
    const blk = dataBytes.slice(offset, offset + info[5]);
    offset += info[5];
    blocks.push(blk);
    ecBlocks.push(rsRemainder(blk, poly));
  }

  const finalCodewords: number[] = [];
  const maxBlockLen = Math.max(info[3], info[5]);
  for (let i = 0; i < maxBlockLen; i++) {
    for (const blk of blocks) {
      if (i < blk.length) finalCodewords.push(blk[i]);
    }
  }
  for (let i = 0; i < ecLen; i++) {
    for (const ec of ecBlocks) {
      finalCodewords.push(ec[i]);
    }
  }

  const finalBits: number[] = [];
  for (const cw of finalCodewords) {
    for (let i = 7; i >= 0; i--) finalBits.push((cw >> i) & 1);
  }

  const size = 17 + 4 * version;
  const matrix: Array<Array<number | null>> = Array.from({ length: size }, () =>
    Array(size).fill(null),
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false),
  );

  function setFunction(r: number, c: number, val: number) {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  }

  function placeFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          setFunction(nr, nc, 0);
        } else if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          setFunction(nr, nc, 1);
        } else {
          setFunction(nr, nc, 0);
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setFunction(6, i, i % 2 === 0 ? 1 : 0);
    if (!isFunction[i][6]) setFunction(i, 6, i % 2 === 0 ? 1 : 0);
  }

  const alignPos = ALIGNMENT_PATTERN_POS[version] || [];
  for (const r of alignPos) {
    for (const c of alignPos) {
      if (isFunction[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isEdge = Math.abs(dr) === 2 || Math.abs(dc) === 2;
          const isCenter = dr === 0 && dc === 0;
          setFunction(r + dr, c + dc, isEdge || isCenter ? 1 : 0);
        }
      }
    }
  }

  setFunction(4 * version + 9, 8, 1);

  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) isFunction[8][size - 1 - i] = true;
    if (!isFunction[size - 1 - i][8]) isFunction[size - 1 - i][8] = true;
  }

  let bitIdx = 0;
  let upwards = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--;
    const rows: number[] = [];
    if (upwards) {
      for (let r = size - 1; r >= 0; r--) rows.push(r);
    } else {
      for (let r = 0; r < size; r++) rows.push(r);
    }
    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (!isFunction[r][c]) {
          matrix[r][c] = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
        }
      }
    }
    upwards = !upwards;
  }

  const FORMAT_MASKS = [
    0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,
  ];

  function maskFunction(pattern: number, r: number, c: number): boolean {
    switch (pattern) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
      default: return false;
    }
  }

  let bestMask = 0;
  let minPenalty = Infinity;
  for (let m = 0; m < 8; m++) {
    let penalty = 0;
    for (let r = 0; r < size; r++) {
      let count = 0;
      let last = -1;
      for (let c = 0; c < size; c++) {
        const val = isFunction[r][c]
          ? (matrix[r][c] as number)
          : ((matrix[r][c] as number) ^ (maskFunction(m, r, c) ? 1 : 0));
        if (val === last) {
          count++;
          if (count === 5) penalty += 3;
          else if (count > 5) penalty += 1;
        } else {
          last = val;
          count = 1;
        }
      }
    }
    if (penalty < minPenalty) {
      minPenalty = penalty;
      bestMask = m;
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c]) {
        if (maskFunction(bestMask, r, c)) {
          matrix[r][c] = (matrix[r][c] as number) ^ 1;
        }
      }
    }
  }

  const formatBits = FORMAT_MASKS[bestMask];
  const fmt: number[] = [];
  for (let i = 14; i >= 0; i--) fmt.push((formatBits >> i) & 1);

  for (let i = 0; i <= 5; i++) matrix[8][i] = fmt[i];
  matrix[8][7] = fmt[6];
  matrix[8][8] = fmt[7];
  matrix[7][8] = fmt[8];
  for (let i = 9; i <= 14; i++) matrix[14 - i][8] = fmt[i];

  for (let i = 0; i <= 7; i++) matrix[size - 1 - i][8] = fmt[i];
  for (let i = 8; i <= 14; i++) matrix[8][size - 15 + i] = fmt[i];

  return matrix.map((row) => row.map((cell) => cell === 1));
}

export function generateQrPath(matrix: boolean[][]): {
  path: string;
  viewBox: string;
} {
  const size = matrix.length;
  const margin = 3;
  const total = size + margin * 2;
  const paths: string[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        const x = c + margin;
        const y = r + margin;
        paths.push(`M${x},${y}h1v1h-1z`);
      }
    }
  }

  return {
    path: paths.join(""),
    viewBox: `0 0 ${total} ${total}`,
  };
}

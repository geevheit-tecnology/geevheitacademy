import QRCode from "qrcode";
/**
 * Gerador de Payload Pix no padrão BR Code / EMVCo do Banco Central do Brasil
 * e renderização local do QR Code, sem envio da chave a terceiros.
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

// Use a maintained encoder for error correction, interleaving and format bits.
export function generateQrMatrix(text: string): boolean[][] {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  return Array.from({ length: modules.size }, (_, row) =>
    Array.from({ length: modules.size }, (_, col) => !!modules.get(row, col)),
  );
}

export function generateQrPath(matrix: boolean[][]): {
  path: string;
  viewBox: string;
} {
  const size = matrix.length;
  const margin = 4;
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

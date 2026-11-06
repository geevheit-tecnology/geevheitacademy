import { useMemo, useState } from "react";
import { Copy, Check, QrCode, Smartphone } from "lucide-react";
import {
  generatePixPayload,
  generateQrMatrix,
  generateQrPath,
} from "../services/pix";
import { currency } from "../services/billing";

interface PixQrCodeProps {
  pixKey: string;
  recipient: string;
  priceCents: number;
  planName: string;
  onCopied?: (text: string) => void;
}

export function PixQrCode({
  pixKey,
  recipient,
  priceCents,
  planName,
  onCopied,
}: PixQrCodeProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const amount = priceCents / 100;

  const payload = useMemo(() => {
    if (!pixKey) return "";
    try {
      return generatePixPayload({
        key: pixKey,
        name: recipient || "TransportSim 360",
        amount,
        city: "SAO PAULO",
      });
    } catch {
      return "";
    }
  }, [pixKey, recipient, amount]);

  const qrSvg = useMemo(() => {
    if (!payload) return null;
    try {
      const matrix = generateQrMatrix(payload);
      return generateQrPath(matrix);
    } catch {
      return null;
    }
  }, [payload]);

  const copyCode = async () => {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedCode(true);
      onCopied?.("Código Pix Copia e Cola copiado com sucesso!");
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      onCopied?.("Não foi possível copiar automaticamente. Selecione e copie o código.");
    }
  };

  const copyKeyOnly = async () => {
    if (!pixKey) return;
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopiedKey(true);
      onCopied?.("Chave Pix copiada!");
      setTimeout(() => setCopiedKey(false), 3000);
    } catch {
      onCopied?.("Copie a chave manualmente.");
    }
  };

  if (!pixKey) return null;

  return (
    <div className="pix-checkout-box">
      <div className="pix-qr-section">
        {qrSvg ? (
          <div className="pix-qr-wrapper" title="Aponte a câmera do aplicativo do seu banco">
            <svg
              viewBox={qrSvg.viewBox}
              className="pix-qr-svg"
              role="img"
              aria-label={`QR Code Pix para pagamento de ${currency(priceCents)}`}
            >
              <rect width="100%" height="100%" fill="#ffffff" />
              <path d={qrSvg.path} fill="#123d30" />
            </svg>
            <span className="pix-qr-caption">
              <QrCode size={15} /> Aponte a câmera do app do banco
            </span>
          </div>
        ) : (
          <div className="pix-qr-placeholder">
            <p>QR Code indisponível.</p>
          </div>
        )}

        <div className="pix-details-section">
          <div className="pix-amount-badge">
            <small>Valor a pagar</small>
            <strong>{currency(priceCents)}</strong>
          </div>

          <dl className="pix-meta-list">
            <div>
              <dt>Plano</dt>
              <dd>{planName}</dd>
            </div>
            <div>
              <dt>Favorecido</dt>
              <dd>{recipient || "Configurado pelo administrador"}</dd>
            </div>
            <div>
              <dt>Chave Pix</dt>
              <dd className="pix-key-val">{pixKey}</dd>
            </div>
          </dl>

          <div className="pix-actions">
            <button
              type="button"
              className="pix-copy-button primary"
              onClick={copyCode}
              disabled={!payload}
            >
              {copiedCode ? (
                <>
                  <Check size={18} /> Código Pix Copiado!
                </>
              ) : (
                <>
                  <Copy size={18} /> Copiar código Pix (Copia e Cola)
                </>
              )}
            </button>

            <button
              type="button"
              className="pix-copy-key-button"
              onClick={copyKeyOnly}
            >
              {copiedKey ? (
                <>
                  <Check size={15} /> Chave copiada
                </>
              ) : (
                <>
                  <Smartphone size={15} /> Copiar apenas a chave
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="pix-instruction-steps">
        <div className="pix-step">
          <span className="pix-step-num">1</span>
          <span>Abra o app do seu banco e escolha <b>Pix</b></span>
        </div>
        <div className="pix-step">
          <span className="pix-step-num">2</span>
          <span>Escaneie o <b>QR Code</b> ou use <b>Pix Copia e Cola</b></span>
        </div>
        <div className="pix-step">
          <span className="pix-step-num">3</span>
          <span>Após pagar, confirme os dados abaixo para <b>liberação imediata</b></span>
        </div>
      </div>
    </div>
  );
}

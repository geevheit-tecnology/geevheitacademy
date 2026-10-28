import { useEffect, useRef, useState } from "react";
import { Handshake, MessageCircle, X, CheckCircle2 } from "lucide-react";
import { saveProcessRecord, type Mission } from "../domain/mission";
import {
  evaluateNegotiation,
  negotiationContext,
  negotiationMoney,
} from "../domain/negotiation";
function Person({ client = false }: { client?: boolean }) {
  return (
    <svg
      viewBox="0 0 140 160"
      className="negotiation-person"
      aria-hidden="true"
    >
      <path fill={client ? "#e7b990" : "#9c6b4e"} d="M50 78h40v40H50z" />
      <path
        fill={client ? "#394867" : "#245b49"}
        d="M12 158v-23c0-25 22-39 58-39s58 14 58 39v23z"
      />
      <path fill="#fff" d="m48 101 22 36 22-36-22 10z" />
      <path
        fill={client ? "#c3915e" : "#c4d896"}
        d="m66 116-5 29 9 12 9-12-5-29z"
      />
      <ellipse
        cx="70"
        cy="57"
        rx="30"
        ry="37"
        fill={client ? "#f0c9a6" : "#b98564"}
      />
      <path
        fill={client ? "#594333" : "#272722"}
        d="M39 55V38c0-32 63-33 63 0v19l-12-26c-10 14-30 7-41 16l-4 14z"
      />
      <path
        d="M56 61h5m18 0h5M62 80q8 6 16 0"
        stroke="#3b3028"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
type Turn = { speaker: "client" | "commercial" | "coach"; text: string };
export function NegotiationScene({
  mission,
  disabled,
  onSave,
}: {
  mission: Mission;
  disabled: boolean;
  onSave: (mission: Mission) => Promise<boolean>;
}) {
  const stored = mission.processRecords?.["9"];
  const context = negotiationContext(mission);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(!stored && !mission.completed);
  const [price, setPrice] = useState(String(context.requested));
  const [argument, setArgument] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [offer, setOffer] = useState<{
    price: number;
    concession: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const conversation = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) {
      element.close();
      opener.current?.focus();
    }
  }, [open]);
  useEffect(() => {
    const element = conversation.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [turns]);
  function propose(value: number, reason: string) {
    setError("");
    setOffer(null);
    try {
      const result = evaluateNegotiation(mission, value, reason);
      setPrice(String(value));
      setArgument(reason);
      setTurns((previous) => [
        ...previous.slice(-10),
        {
          speaker: "commercial",
          text: `${negotiationMoney(value)}. ${reason}`,
        },
        {
          speaker:
            result.accepted || value > context.proposal ? "client" : "coach",
          text: result.reply,
        },
      ]);
      if (result.accepted)
        setOffer({ price: value, concession: result.concession });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revise sua proposta.");
    }
  }
  return (
    <>
      <section className="negotiation-scene">
        <span className="eyebrow">
          <Handshake size={16} /> SALA DE NEGOCIAÇÃO
        </span>
        <h2>Uma boa operação começa no acordo.</h2>
        <p>
          Converse com o cliente, defenda sua proposta e feche um frete que
          preserve a margem.
        </p>
        <div className="negotiation-cast">
          <div>
            <Person />
            <b>Você</b>
            <span>Comercial da transportadora</span>
          </div>
          <MessageCircle size={30} />
          <div>
            <Person client />
            <b>Cliente</b>
            <span>{mission.input.client}</span>
          </div>
        </div>
        <div className="negotiation-table">
          <span>Proposta enviada</span>
          <strong>{negotiationMoney(context.proposal)}</strong>
          <small>
            {mission.input.origin} → {mission.input.destination}
          </small>
        </div>
        {stored && (
          <p className="negotiation-agreed">
            <CheckCircle2 size={18} /> Acordo registrado:{" "}
            {negotiationMoney(Number(stored.values.freight))}
          </p>
        )}
        <button
          ref={opener}
          className="primary"
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          <MessageCircle size={18} />{" "}
          {stored ? "Reabrir negociação" : "Conversar com o cliente"}
        </button>
        <small>
          Conversa de treinamento. O transporte será acompanhado no mapa.
        </small>
      </section>
      <dialog
        ref={dialog}
        className="negotiation-dialog"
        aria-labelledby="negotiation-title"
        onCancel={(e) => {
          if (saving) e.preventDefault();
          else setOpen(false);
        }}
        onClose={() => setOpen(false)}
      >
        <header className="negotiation-dialog-header">
          <div>
            <span className="eyebrow">SIMULAÇÃO COMERCIAL</span>
            <h2 id="negotiation-title">Negocie com o cliente</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Fechar negociação"
            disabled={saving}
            onClick={() => setOpen(false)}
          >
            <X size={22} />
          </button>
        </header>
        <div className="negotiation-dialog-body">
          <div
            className="negotiation-meeting"
            aria-label="Participantes da negociação"
          >
            <div>
              <Person />
              <span>
                <b>Você</b>
                <small>Comercial da transportadora</small>
              </span>
            </div>
            <Handshake size={24} aria-hidden="true" />
            <div>
              <Person client />
              <span>
                <b>Cliente</b>
                <small>{mission.input.client}</small>
              </span>
            </div>
          </div>
          <div className="negotiation-brief">
            <span>
              Custo: <b>{negotiationMoney(context.costs)}</b>
            </span>
            <span>
              Margem mínima: <b>{context.targetMargin}%</b>
            </span>
            <span>
              Frete mínimo: <b>{negotiationMoney(context.minimum)}</b>
            </span>
          </div>
          <div
            ref={conversation}
            className="negotiation-conversation"
            role="log"
            aria-label="Conversa entre cliente e comercial"
            aria-live="polite"
          >
            <article className="negotiation-bubble client">
              <span>Cliente · {mission.input.client}</span>
              <p>
                Recebi a proposta de {negotiationMoney(context.proposal)} para{" "}
                {mission.input.destination}. Se reduzirmos para{" "}
                {negotiationMoney(context.requested)}, conseguimos fechar?
                Preciso manter o prazo combinado.
              </p>
            </article>
            {turns.map((turn, index) => (
              <article
                key={index}
                className={`negotiation-bubble ${turn.speaker}`}
              >
                <span>
                  {turn.speaker === "commercial"
                    ? "Você · Comercial"
                    : turn.speaker === "coach"
                      ? "Orientação do treinamento"
                      : "Cliente"}
                </span>
                <p>{turn.text}</p>
              </article>
            ))}
          </div>
          <fieldset
            disabled={disabled || saving}
            className="negotiation-responses"
          >
            <legend>Como você vai negociar?</legend>
            <div className="negotiation-options">
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  propose(
                    context.proposal,
                    "Mantemos o preço para garantir veículo adequado, acompanhamento da viagem e o prazo contratado.",
                  )
                }
              >
                Defender o valor da proposta
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  propose(
                    context.requested,
                    "Posso oferecer os 8% de desconto solicitados, mantendo o escopo e o prazo acordados.",
                  )
                }
              >
                Avaliar o desconto de 8%
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                propose(Number(price), argument);
              }}
            >
              <label>
                Sua contraproposta em R$
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setOffer(null);
                  }}
                />
              </label>
              <label>
                Como você justifica essa condição?
                <textarea
                  required
                  minLength={10}
                  maxLength={300}
                  value={argument}
                  onChange={(e) => {
                    setArgument(e.target.value);
                    setOffer(null);
                  }}
                />
              </label>
              <button type="submit" className="secondary">
                Apresentar contraproposta
              </button>
            </form>
          </fieldset>
          {error && (
            <p role="alert" className="notice">
              {error}
            </p>
          )}
          {offer && (
            <div className="negotiation-confirm">
              <p>
                <CheckCircle2 size={18} /> Cliente aceitou{" "}
                {negotiationMoney(offer.price)}. Registre o acordo para aplicar
                o frete à missão.
              </p>
              <button
                className="primary"
                disabled={disabled || saving}
                onClick={async () => {
                  setSaving(true);
                  setError("");
                  try {
                    const next = saveProcessRecord(mission, {
                      freight: String(offer.price),
                      concession: offer.concession,
                    });
                    if (await onSave(next)) setOpen(false);
                    else
                      setError(
                        "O acordo não foi sincronizado. Confira a conexão e o rascunho pendente.",
                      );
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Não foi possível salvar o acordo.",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Registrando acordo…" : "Registrar acordo na missão"}
              </button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}

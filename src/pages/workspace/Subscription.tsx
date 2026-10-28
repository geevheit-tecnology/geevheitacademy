import {
  startTrial,
  setSubscriptionCanceled,
} from "../../services/subscriptionActions";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useAuth } from "../../features/auth/AuthContext";
import { currency, useBilling } from "../../services/billing";
import { db } from "../../services/firebase";
export function Subscription() {
  const { user } = useAuth();
  const {
    config,
    expiresAt,
    trialEndsAt,
    hasTrial,
    canceled,
    now,
    loading,
    error,
  } = useBilling();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [reference, setReference] = useState("");
  useEffect(() => {
    if (!db || !user) return;
    return onSnapshot(
      query(collection(db, "paymentRequests"), where("uid", "==", user.uid)),
      (snap) =>
        setPending(snap.docs.some((d) => d.data().status === "pending")),
      () => setMessage("Não foi possível carregar seus pagamentos."),
    );
  }, [user]);
  async function request() {
    if (!db || !user) return;
    setBusy(true);
    setMessage("");
    try {
      await addDoc(collection(db, "paymentRequests"), {
        uid: user.uid,
        email: user.email || "",
        status: "pending",
        payerName: payerName.trim(),
        reference: reference.trim(),
        priceCents: config.priceCents,
        days: config.days,
        planName: config.name,
        createdAt: serverTimestamp(),
      });
      setMessage(
        "Pagamento informado. Aguarde a conferência do administrador para liberação.",
      );
    } catch {
      setMessage("Não foi possível informar o pagamento. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function changeCancellation(next: boolean) {
    if (!user) return;
    setBusy(true);
    setMessage("");
    try {
      await setSubscriptionCanceled(user.uid, next);
      setMessage(
        next
          ? "Assinatura cancelada. Seu acesso permanece até o fim do período vigente. Pedidos pendentes foram cancelados."
          : "Assinatura reativada. Nenhuma cobrança foi realizada.",
      );
    } catch {
      setMessage("Não foi possível atualizar a assinatura. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p>Carregando assinatura…</p>;
  return (
    <section className="billing-page">
      <h1>Minha assinatura</h1>
      {error && <p role="alert">{error}</p>}
      <p>
        {expiresAt > now
          ? `Acesso liberado até ${new Date(expiresAt).toLocaleString("pt-BR")}.`
          : "Sua assinatura ainda não está ativa."}
      </p>
      <article className="billing-card trial-card">
        <span className="eyebrow">3 DIAS GRÁTIS PARA TESTAR</span>
        <h2>
          {trialEndsAt > now
            ? "Seu período de teste está ativo"
            : hasTrial
              ? "Seu período de teste terminou"
              : "Experimente o treinamento completo"}
        </h2>
        <p>
          {trialEndsAt > now
            ? `Teste liberado até ${new Date(trialEndsAt).toLocaleString("pt-BR")}.`
            : hasTrial
              ? "Escolha a assinatura para continuar criando e executando missões."
              : "Teste por 72 horas, sem cartão e sem cobrança automática."}
        </p>
        {!hasTrial && (
          <button
            className="primary"
            disabled={busy || !!error}
            onClick={async () => {
              if (!user) return;
              setBusy(true);
              try {
                await startTrial(user.uid);
                setMessage("Seu teste de 3 dias começou.");
              } catch {
                setMessage("Não foi possível iniciar o teste.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Ativar meus 3 dias grátis
          </button>
        )}
      </article>
      <article className="billing-card">
        <h2>
          {canceled ? "Assinatura cancelada" : "Você controla sua assinatura"}
        </h2>
        <p>
          Cancele quando quiser. O acesso já liberado permanece até o fim do
          período. Não há débito automático; cada renovação é feita por você via
          Pix.
        </p>
        <button
          className="secondary"
          disabled={busy || !!error}
          onClick={() => {
            if (
              canceled ||
              window.confirm(
                "Cancelar a assinatura e os pedidos de pagamento pendentes? Seu acesso vigente será mantido até o vencimento.",
              )
            )
              void changeCancellation(!canceled);
          }}
        >
          {canceled ? "Reativar assinatura" : "Cancelar assinatura"}
        </button>
      </article>
      <article className="billing-card">
        <h2>{config.name}</h2>
        {config.enabled && !canceled ? (
          <>
            <strong className="billing-price">
              {currency(config.priceCents)} / {config.days} dias
            </strong>
            <p>
              Renovação por Pix a cada período. O acesso é liberado após
              conferência manual do recebimento.
            </p>
            <dl>
              <dt>Favorecido</dt>
              <dd>{config.recipient}</dd>
              <dt>Chave Pix</dt>
              <dd className="pix-key">{config.pixKey}</dd>
            </dl>
            <button
              className="small-button"
              onClick={() => {
                void navigator.clipboard.writeText(config.pixKey).then(
                  () => setMessage("Chave copiada."),
                  () => setMessage("Copie a chave Pix exibida acima."),
                );
              }}
            >
              Copiar chave Pix
            </button>
            <p>
              Confira o favorecido no aplicativo do seu banco e pague o valor
              indicado. Depois, informe o pagamento abaixo. A solicitação não
              confirma o recebimento.
            </p>
            <form
              className="billing-form"
              onSubmit={(e) => {
                e.preventDefault();
                void request();
              }}
            >
              <label>
                Nome de quem fez o Pix
                <input
                  required
                  maxLength={150}
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                />
              </label>
              <label>
                Identificador da transação no comprovante
                <input
                  required
                  maxLength={150}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </label>
              <button className="primary" disabled={busy || pending || !!error}>
                {pending
                  ? "Pagamento aguardando conferência"
                  : busy
                    ? "Enviando…"
                    : "Já paguei — solicitar conferência"}
              </button>
            </form>
          </>
        ) : (
          <p>
            {canceled
              ? "Reative sua assinatura para informar novos pagamentos por Pix."
              : "Assinaturas ainda não disponíveis para contratação."}
          </p>
        )}
      </article>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </section>
  );
}

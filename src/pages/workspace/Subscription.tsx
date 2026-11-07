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
import { PixQrCode } from "../../components/PixQrCode";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
export function Subscription() {
  const { user } = useAuth();
  const {
    config,
    expiresAt,
    manualExpiresAt,
    blocked,
    maintenance,
    supportEmail,
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
    if (!db || !user || blocked || canceled || !config.enabled || pending || error) return;
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
      {blocked && (
        <div role="alert" className="notice">
          <b>Acesso aos treinamentos bloqueado pelo administrador.</b>
          <p>
            Consulte o suporte: {supportEmail}. Pagar ou reativar a assinatura
            não remove esse bloqueio.
          </p>
        </div>
      )}
      {maintenance && (
        <div role="status" className="notice">
          Os treinamentos estão pausados para manutenção. Sua conta e sua
          assinatura continuam disponíveis.
        </div>
      )}
      {manualExpiresAt > now && (
        <p className="notice">
          Liberação administrativa vigente até{" "}
          {new Date(manualExpiresAt).toLocaleString("pt-BR")}.
        </p>
      )}
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
            disabled={busy || blocked || !!error}
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
        {config.enabled && !canceled && !blocked ? (
          <>
            <strong className="billing-price">
              {currency(config.priceCents)} / {config.days} dias
            </strong>
            <p>
              Renovação por Pix a cada período. O acesso é liberado após
              conferência do recebimento.
            </p>

            {pending ? (
              <div className="pix-live-status pending">
                <div className="pulse-indicator" />
                <div>
                  <h3>Pagamento em conferência — aguardando liberação</h3>
                  <p>
                    <strong>Você não precisa sair desta página nem recarregar.</strong> Assim que o administrador
                    confirmar o Pix, o seu acesso será liberado automaticamente aqui em tempo real.
                  </p>
                </div>
              </div>
            ) : expiresAt > now ? (
              <div className="pix-live-status active">
                <CheckCircle2 size={28} />
                <div>
                  <h3>Assinatura ativa e liberada!</h3>
                  <p>
                    Seu acesso está válido até {new Date(expiresAt).toLocaleString("pt-BR")}.
                  </p>
                </div>
                <Link to="/app/nova" className="primary small-button">
                  Nova missão <ArrowRight size={16} />
                </Link>
              </div>
            ) : null}

            {!pending && <PixQrCode
              pixKey={config.pixKey}
              recipient={config.recipient}
              priceCents={config.priceCents}
              planName={config.name}
              onCopied={setMessage}
            />}

            <form
              className="billing-form"
              onSubmit={(e) => {
                e.preventDefault();
                void request();
              }}
            >
              <h3>Confirmar pagamento</h3>
              <p>
                Após efetuar o Pix no app do seu banco, confirme os dados abaixo
                para localizar a transferência:
              </p>
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
                {pending ? (
                  <>
                    <Clock size={16} /> Pagamento aguardando conferência
                  </>
                ) : busy ? (
                  "Enviando…"
                ) : (
                  "Já paguei — solicitar conferência"
                )}
              </button>
            </form>
          </>
        ) : (
          <p>
            {blocked
              ? "Consulte o administrador antes de informar novos pagamentos."
              : canceled
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

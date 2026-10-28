import { administratorEmail } from "../domain/adminAccess";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { useAuth } from "../features/auth/AuthContext";
export type BillingConfig = {
  enabled: boolean;
  name: string;
  priceCents: number;
  days: number;
  pixKey: string;
  recipient: string;
};
export const defaultBilling: BillingConfig = {
  enabled: false,
  name: "Assinatura TransportSim 360",
  priceCents: 0,
  days: 30,
  pixKey: "",
  recipient: "",
};
export const currency = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export function useBilling() {
  const { user } = useAuth();
  const [config, setConfig] = useState(defaultBilling);
  const [admin, setAdmin] = useState(false);
  const [expiresAt, setExpiresAt] = useState(0);
  const [trialEndsAt, setTrialEndsAt] = useState(0);
  const [hasTrial, setHasTrial] = useState(false);
  const [canceled, setCanceled] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setAdmin(false);
    setExpiresAt(0);
    setTrialEndsAt(0);
    setHasTrial(false);
    setCanceled(false);
    setLoading(true);
    setError("");
    if (!db) {
      setLoading(false);
      setError("Serviço indisponível.");
      return;
    }
    const pending = new Set(
      user
        ? ["config", "admin", "subscription", "trial", "preferences"]
        : ["config"],
    );
    const done = (key: string) => {
      pending.delete(key);
      if (pending.size === 0) setLoading(false);
    };
    const fail = (key: string) => () => {
      setError("Não foi possível verificar a assinatura. Tente novamente.");
      done(key);
    };
    const stop = onSnapshot(
      doc(db, "billing/config"),
      (snap) => {
        setConfig(
          snap.exists() ? (snap.data() as BillingConfig) : defaultBilling,
        );
        done("config");
      },
      fail("config"),
    );
    const stops = [stop];
    if (user) {
      stops.push(
        onSnapshot(
          doc(db, "admins", user.uid),
          (snap) => {
            setAdmin(user.email === administratorEmail && snap.exists());
            done("admin");
          },
          fail("admin"),
        ),
      );
      stops.push(
        onSnapshot(
          doc(db, "subscriptions", user.uid),
          (snap) => {
            setExpiresAt(snap.exists() ? snap.data().expiresAt.toMillis() : 0);
            done("subscription");
          },
          fail("subscription"),
        ),
      );
    }
    if (user) {
      stops.push(
        onSnapshot(
          doc(db, "trials", user.uid),
          (snap) => {
            setHasTrial(snap.exists());
            setTrialEndsAt(
              snap.exists()
                ? snap.data().startedAt?.toMillis() + 3 * 86400000 || 0
                : 0,
            );
            done("trial");
          },
          fail("trial"),
        ),
      );
      stops.push(
        onSnapshot(
          doc(db, "subscriptionPreferences", user.uid),
          (snap) => {
            setCanceled(snap.exists() && snap.data().canceled === true);
            done("preferences");
          },
          fail("preferences"),
        ),
      );
    }
    return () => stops.forEach((stop) => stop());
  }, [user]);
  return {
    config,
    admin,
    expiresAt,
    trialEndsAt,
    hasTrial,
    canceled,
    active: Math.max(expiresAt, trialEndsAt) > now,
    now,
    loading,
    error,
  };
}

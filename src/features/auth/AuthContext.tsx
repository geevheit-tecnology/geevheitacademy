import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../../services/firebase";
const Context = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!auth);
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(
      auth,
      (u) => {
        setUser(u);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);
  return (
    <Context.Provider value={{ user, loading }}>{children}</Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  return loading ? (
    <main className="center">Verificando sessão…</main>
  ) : user ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}

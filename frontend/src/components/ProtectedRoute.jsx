import { useEffect, useState } from "react";
import { useAppStore } from "../stores/appStore";
import { Navigate } from "react-router-dom";

function useSessionReady() {
  const [ready, setReady] = useState(() => useAppStore.persist.hasHydrated());

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      setReady(true);
      return;
    }

    return useAppStore.persist.onFinishHydration(() => setReady(true));
  }, []);

  return ready;
}

function ProtectedRoute({ children }) {
  const user = useAppStore((s) => s.user.value);
  const token = useAppStore((s) => s.user.token);
  if (!user || !token) return <Navigate to="/login" />;
  return children;
}

function GuestRoute({ children }) {
  const ready = useSessionReady();
  const user = useAppStore((s) => s.user.value);
  const token = useAppStore((s) => s.user.token);

  if (!ready) return null;
  if (user && token) return <Navigate to="/todos" replace />;
  return children;
}

export default ProtectedRoute;
export { GuestRoute, useSessionReady };

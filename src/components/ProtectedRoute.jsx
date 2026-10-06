import { useAppStore } from "../stores/appStore";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const user = useAppStore((s) => s.user.value)
    const token = useAppStore((s) => s.user.token)
    if (!user || !token) return <Navigate to="/login"/>
    return children
}

export default ProtectedRoute;
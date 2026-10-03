import { useAppStore } from "../stores/appStore";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const user = useAppStore((s) => s.user.value)
    if (!user) return <Navigate to="/login"/>
    return children
}

export default ProtectedRoute;
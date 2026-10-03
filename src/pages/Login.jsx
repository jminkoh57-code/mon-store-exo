import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../stores/appStore";

function Login() {
  const user = useAppStore((state) => state.user);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();

    const loggedIn = user.login(form.email, form.password);

    if (!loggedIn) {
      setError("Email ou mot de passe incorrect.");
      return;
    }

    navigate("/todos");
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-sm p-4" style={{ width: "450px" }}>
        <div className="card-body">
          <h2 className="text-center fw-bold mb-4">Connexion</h2>

          <p className="text-muted text-center mb-4">
            Connectez-vous pour accéder à vos todos.
          </p>

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label">Email</label>

              <input
                type="email"
                name="email"
                className="form-control"
                value={form.email}
                onChange={handleChange}
                placeholder="nom@example.com"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Mot de passe</label>

              <input
                type="password"
                name="password"
                className="form-control"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-danger text-center">{error}</p>
            )}

            <button type="submit" className="btn btn-primary w-100">
              Se connecter
            </button>
          </form>

          <p className="text-center text-muted mt-4 mb-0">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-decoration-none">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

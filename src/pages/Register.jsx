import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../stores/appStore";

function Register() {
  const user = useAppStore((state) => state.user);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    const result = await user.register({
      name: form.name,
      email: form.email,
      password: form.password,
    });

    if (!result.ok) {
      alert(result.message);
      return;
    }

    navigate("/todos");
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-sm p-4" style={{ width: "450px" }}>
        <div className="card-body">
          <h2 className="text-center fw-bold mb-4">
            Créer un compte
          </h2>

          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label className="form-label">
                Nom
              </label>

              <input
                type="text"
                name="name"
                className="form-control"
                value={form.name}
                onChange={handleChange}
                placeholder="Votre nom"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Email
              </label>

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

            <div className="mb-3">
              <label className="form-label">
                Mot de passe
              </label>

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

            <div className="mb-4">
              <label className="form-label">
                Confirmer le mot de passe
              </label>

              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
            >
              Créer mon compte
            </button>
          </form>

          <p className="text-center text-muted mt-4 mb-0">
            Vous avez déjà un compte ?{" "}
            <Link to="/login" className="text-decoration-none">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;

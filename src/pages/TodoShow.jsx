import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../stores/appStore";

function TodoShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showTodo = useAppStore((state) => state.todos.show);
  const user = useAppStore((state) => state.user);
  const [todo, setTodo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user.value === null) {
      navigate("/login");
      return;
    }

    showTodo(id)
      .then(setTodo)
      .catch((requestError) => setError(requestError.message));
  }, [id, user.value]);

  if (user.value === null) {
    return null;
  }

  return (
    <div className="container py-5">
      <div className="row align-items-center g-4">
      <div className="col-lg-7">
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <h1 className="h3 fw-bold mb-4">Détail de la tâche</h1>

          {error ? (
            <p className="text-danger">{error}</p>
          ) : !todo ? (
            <p className="text-muted mb-0">Chargement…</p>
          ) : (
            <dl className="row mb-0">
              <dt className="col-sm-3">Texte</dt>
              <dd className="col-sm-9">{todo.text}</dd>

              <dt className="col-sm-3">Statut</dt>
              <dd className="col-sm-9">
                {todo.done ? "Terminée" : "À faire"}
              </dd>

              <dt className="col-sm-3">Créée le</dt>
              <dd className="col-sm-9">
                {new Date(todo.createdAt).toLocaleString("fr-FR")}
              </dd>
            </dl>
          )}

          <div className="d-flex gap-2 mt-4">
            <Link to="/todos" className="btn btn-outline-secondary">
              Retour
            </Link>

            {!error && (
              <Link to={`/todos/${id}/edit`} className="btn btn-primary">
                Modifier
              </Link>
            )}
          </div>
        </div>
      </div>
      </div>
      <div className="col-lg-5">
        <img
          src="/images/detail.svg"
          alt="Illustration du détail d'une tâche"
          className="img-fluid rounded-4 shadow-sm"
        />
      </div>
      </div>
    </div>
  );
}

export default TodoShow;

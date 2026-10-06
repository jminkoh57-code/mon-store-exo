import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../stores/appStore";

function TodoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showTodo = useAppStore((state) => state.todos.show);
  const updateTodo = useAppStore((state) => state.todos.update);
  const user = useAppStore((state) => state.user);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (user.value === null) {
      navigate("/login");
      return;
    }

    showTodo(id)
      .then((todo) => {
        setText(todo.text);
        setReady(true);
      })
      .catch((requestError) => setError(requestError.message));
  }, [id, user.value]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!text.trim()) return;

    try {
      await updateTodo(id, text);
      navigate(`/todos/${id}`);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (user.value === null) {
    return null;
  }

  return (
    <div className="container py-5">
      <div className="row align-items-center g-4">
      <div className="col-lg-7">
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <h1 className="h3 fw-bold mb-4">Modifier la tâche</h1>

          {error && <p className="text-danger">{error}</p>}

          {!ready && !error ? (
            <p className="text-muted mb-0">Chargement…</p>
          ) : ready ? (
            <form onSubmit={handleSubmit}>
              <label className="form-label" htmlFor="todo-text">
                Texte
              </label>

              <input
                id="todo-text"
                type="text"
                className="form-control mb-4"
                value={text}
                onChange={(event) => setText(event.target.value)}
                required
              />

              <div className="d-flex gap-2">
                <Link to={`/todos/${id}`} className="btn btn-outline-secondary">
                  Annuler
                </Link>

                <button type="submit" className="btn btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          ) : (
            <Link to="/todos" className="btn btn-outline-secondary">
              Retour
            </Link>
          )}
        </div>
      </div>
      </div>
      <div className="col-lg-5">
        <img
          src="/images/modifier.svg"
          alt="Illustration de la modification d'une tâche"
          className="img-fluid rounded-4 shadow-sm"
        />
      </div>
      </div>
    </div>
  );
}

export default TodoEdit;

import { useAppStore } from "../stores/appStore";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function Todos() {
  const todos = useAppStore((state) => state.todos);
  const user = useAppStore((state) => state.user);

  const navigate = useNavigate();
  const [text, setText] = useState("");

  useEffect(() => {
    if (user.value === null) {
      navigate("/login");
      return;
    }

    todos.fetch();
  }, [user.value]);

  const handleAddTodo = async () => {
    if (!text.trim()) return;

    try {
      await todos.add(text);
      setText("");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    user.logout();
    navigate("/login");
  };

  if (user.value === null) {
    return null;
  }

  return (
    <div className="container py-5">
      <div className="row align-items-center g-4 mb-4">
        <div className="col-lg-7">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="fw-bold">
                Salut {user.value.name} 👋
              </h1>

              <p className="text-muted mb-0">
                Voici tes todos
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          </div>
        </div>

        <div className="col-lg-5">
          <img
            src="/images/taches.svg"
            alt="Illustration de tes tâches"
            className="img-fluid rounded-4 shadow-sm"
          />
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddTodo();
                }
              }}
              placeholder="Nouveau todo"
            />

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddTodo}
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">
            Mes tâches
          </h5>

          {todos.loading ? (
            <p className="text-muted mb-0">
              Chargement des todos…
            </p>
          ) : todos.value.length === 0 ? (
            <div className="text-center">
              <img
                src="/images/accueil-liste.svg"
                alt=""
                className="img-fluid rounded-4 mb-3"
                style={{ maxWidth: "280px" }}
              />
              <p className="text-muted mb-0">
                Aucun todo pour le moment.
              </p>
            </div>
          ) : (
            <div className="list-group">
              {todos.value.map((todo) => (
                <div
                  key={todo.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <button
                    type="button"
                    onClick={() => todos.toggle(todo.id)}
                    className="btn text-start flex-grow-1"
                  >
                    <span
                      className={
                        todo.done
                          ? "text-decoration-line-through text-muted"
                          : ""
                      }
                    >
                      {todo.text}
                    </span>
                  </button>

                  <div className="d-flex align-items-center gap-2">
                    {todo.done && (
                      <span className="badge bg-success">
                        ✓ Terminé
                      </span>
                    )}

                    <Link
                      to={`/todos/${todo.id}`}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Voir
                    </Link>

                    <Link
                      to={`/todos/${todo.id}/edit`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Modifier
                    </Link>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => todos.delete(todo.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Todos;
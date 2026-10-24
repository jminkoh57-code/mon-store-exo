import { useAppStore } from "../stores/appStore";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import Photo from "../components/Photo";
import { photos } from "../data/openverse";

function Todos() {
  const todos = useAppStore((state) => state.todos);
  const user = useAppStore((state) => state.user);

  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [finished, setFinished] = useState(null);
  const fileInput = useRef(null);

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
      await todos.add(text, image);
      setText("");
      setImage(null);
      if (fileInput.current) {
        fileInput.current.value = "";
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleToggle = async (todo) => {
    try {
      await todos.toggle(todo.id);

      if (!todo.done) {
        setFinished(todo);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteFinished = async () => {
    if (!finished) return;

    try {
      await todos.delete(finished.id);
      setFinished(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleReopenFinished = async () => {
    if (!finished) return;

    try {
      await todos.toggle(finished.id);
      setFinished(null);
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
              <Icon name="logout" />
              Déconnexion
            </button>
          </div>
        </div>

        <div className="col-lg-5 d-flex justify-content-lg-end justify-content-center">
          <Photo photo={photos.dessin} className="photo-frame-sm" />
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
              <Icon name="plus" />
              Ajouter
            </button>
          </div>

          <div className="mt-3">
            <label className="form-label" htmlFor="todo-image">
              Image de la tâche
            </label>
            <input
              id="todo-image"
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="form-control"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            />
            <div className="form-text">
              Facultatif. JPEG, PNG, WebP ou GIF, 2 Mo maximum.
            </div>
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
            <p className="text-muted mb-0">
              <Icon name="list" />
              Aucun todo pour le moment.
            </p>
          ) : (
            <div className="list-group">
              {todos.value.map((todo) => (
                <div
                  key={todo.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(todo)}
                    className="btn text-start flex-grow-1 d-flex align-items-center gap-3"
                  >
                    {todo.imageUrl && (
                      <img
                        src={todo.imageUrl}
                        alt=""
                        className="todo-thumb rounded"
                      />
                    )}
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
                      <Icon name="eye" />
                      Voir
                    </Link>

                    <Link
                      to={`/todos/${todo.id}/edit`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      <Icon name="pencil" />
                      Modifier
                    </Link>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => todos.delete(todo.id)}
                    >
                      <Icon name="trash" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {finished && (
        <>
          <div className="modal-backdrop fade show" />
          <div
            className="modal fade show d-block"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finished-title"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title h5" id="finished-title">
                    Tâche terminée
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Fermer"
                    onClick={() => setFinished(null)}
                  />
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    « {finished.text} » est terminée. Que veux-tu faire ensuite ?
                  </p>
                </div>
                <div className="modal-footer flex-wrap">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setFinished(null)}
                  >
                    <Icon name="check" />
                    La garder
                  </button>
                  <Link
                    to={`/todos/${finished.id}`}
                    className="btn btn-outline-primary"
                  >
                    <Icon name="eye" />
                    Voir
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={handleReopenFinished}
                  >
                    Remettre à faire
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={handleDeleteFinished}
                  >
                    <Icon name="trash" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Todos;
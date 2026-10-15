import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../stores/appStore";
import Icon from "../components/Icon";
import Photo from "../components/Photo";
import { photos } from "../data/openverse";

function TodoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showTodo = useAppStore((state) => state.todos.show);
  const updateTodo = useAppStore((state) => state.todos.update);
  const user = useAppStore((state) => state.user);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
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
        setImageUrl(todo.imageUrl);
        setReady(true);
      })
      .catch((requestError) => setError(requestError.message));
  }, [id, user.value]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!text.trim()) return;

    try {
      await updateTodo(id, {
        text,
        imageFile,
        removeImage: removeImage && !imageFile,
      });
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

              <label className="form-label" htmlFor="todo-image">
                Image de la tâche
              </label>

              {imageUrl && !removeImage && !imageFile && (
                <img
                  src={imageUrl}
                  alt={text}
                  className="todo-image rounded-4 mb-3"
                />
              )}

              <input
                id="todo-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="form-control"
                onChange={(event) => {
                  setImageFile(event.target.files?.[0] ?? null);
                  setRemoveImage(false);
                }}
              />
              <div className="form-text mb-3">
                JPEG, PNG, WebP ou GIF, 2 Mo maximum.
              </div>

              {imageUrl && (
                <div className="form-check mb-4">
                  <input
                    id="remove-image"
                    type="checkbox"
                    className="form-check-input"
                    checked={removeImage}
                    onChange={(event) => {
                      setRemoveImage(event.target.checked);
                      if (event.target.checked) {
                        setImageFile(null);
                      }
                    }}
                  />
                  <label className="form-check-label" htmlFor="remove-image">
                    Retirer l'image
                  </label>
                </div>
              )}

              <div className="d-flex gap-2">
                <Link to={`/todos/${id}`} className="btn btn-outline-secondary">
                  Annuler
                </Link>

                <button type="submit" className="btn btn-primary">
                  <Icon name="check" />
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
        <Photo photo={photos.carnet} />
      </div>
      </div>
    </div>
  );
}

export default TodoEdit;

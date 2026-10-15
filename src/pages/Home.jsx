import { Link } from "react-router-dom";
import { useAppStore } from "../stores/appStore";
import Icon from "../components/Icon";
import Photo from "../components/Photo";
import { photos } from "../data/openverse";

const highlights = [
  {
    photo: photos.bureau,
    icon: "user",
    title: "Un compte à toi",
    text: "Inscris-toi pour retrouver tes tâches sur cet appareil.",
  },
  {
    photo: photos.notes,
    icon: "list",
    title: "Une liste claire",
    text: "Ajoute, consulte et modifie chaque tâche.",
  },
  {
    photo: photos.carnet,
    icon: "check",
    title: "Tout est conservé",
    text: "Tes todos restent enregistrés dans la base de données.",
  },
];

function Home() {
  const user = useAppStore((state) => state.user.value);

  return (
    <div className="container py-5">
      <div className="row align-items-center g-4 mb-5">
        <div className="col-lg-6">
          <p className="text-primary fw-semibold mb-2">Accueil</p>
          <h1 className="display-5 fw-bold mb-3">
            Tes tâches, au même endroit.
          </h1>
          <p className="lead text-muted">
            Crée un compte, note ce que tu as à faire, et retrouve ta liste
            la prochaine fois.
          </p>
          <div className="d-flex flex-wrap gap-2 mt-4">
            {user ? (
              <Link to="/todos" className="btn btn-primary btn-lg">
                <Icon name="list" />
                Voir mes tâches
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  <Icon name="user" />
                  Créer un compte
                </Link>
                <Link to="/login" className="btn btn-outline-primary btn-lg">
                  <Icon name="check" />
                  Se connecter
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <Photo photo={photos.taches} />
        </div>
      </div>

      <div className="row g-4">
        {highlights.map((item) => (
          <div className="col-md-4" key={item.title}>
            <div className="card h-100 shadow-sm border-0">
              <Photo photo={item.photo} />
              <div className="card-body">
                <h2 className="h5 fw-bold">
                  <Icon name={item.icon} />
                  {item.title}
                </h2>
                <p className="text-muted mb-0">{item.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;

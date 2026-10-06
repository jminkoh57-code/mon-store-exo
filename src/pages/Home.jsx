import { Link } from "react-router-dom";
import { useAppStore } from "../stores/appStore";

const highlights = [
  {
    image: "/images/accueil-compte.svg",
    title: "Un compte à toi",
    text: "Inscris-toi pour retrouver tes tâches sur cet appareil.",
  },
  {
    image: "/images/accueil-liste.svg",
    title: "Une liste claire",
    text: "Ajoute, consulte et modifie chaque tâche.",
  },
  {
    image: "/images/accueil-sauve.svg",
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
                Voir mes tâches
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Créer un compte
                </Link>
                <Link to="/login" className="btn btn-outline-primary btn-lg">
                  Se connecter
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <img
            src="/images/accueil-taches.svg"
            alt="Illustration d'une liste de tâches"
            className="img-fluid rounded-4 shadow-sm"
          />
        </div>
      </div>

      <div className="row g-4">
        {highlights.map((item) => (
          <div className="col-md-4" key={item.title}>
            <div className="card h-100 shadow-sm border-0">
              <img
                src={item.image}
                alt=""
                className="card-img-top"
              />
              <div className="card-body">
                <h2 className="h5 fw-bold">{item.title}</h2>
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

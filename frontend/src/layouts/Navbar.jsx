import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { useAppStore } from "../stores/appStore";
import { useSessionReady } from "../components/ProtectedRoute";

function Navbar() {
    const ready = useSessionReady();
    const loggedIn = useAppStore(
        (state) => Boolean(state.user.value && state.user.token)
    );

    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">

                <button
                    data-mdb-button-init
                    className="navbar-toggler"
                    type="button"
                    data-mdb-collapse-init
                    data-mdb-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <i className="fas fa-bars"></i>
                </button>

                <div
                    className="collapse navbar-collapse"
                    id="navbarSupportedContent"
                >
                    {/* <a
                        className="navbar-brand mt-2 mt-lg-0"
                        href="/"
                    >
                        <img
                            src="https://mdbcdn.b-cdn.net/img/logo/mdb-transaprent-noshadows.webp"
                            height="15"
                            alt="MDB Logo"
                            loading="lazy"
                        />
                    </a> */}

                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link d-inline-flex align-items-center" to="/">
                                <Icon name="home" />
                                Accueil
                            </Link>
                        </li>

                        <li className="nav-item">
                            <Link className="nav-link d-inline-flex align-items-center" to="/todos">
                                <Icon name="list" />
                                Todos
                            </Link>
                        </li>

                        {ready && !loggedIn && (
                            <li className="nav-item">
                                <Link className="nav-link d-inline-flex align-items-center" to="/register">
                                    <Icon name="user" />
                                    Register
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>

                {/* <div className="d-flex align-items-center">

                    <a className="text-reset me-3" href="#">
                        <i className="fas fa-shopping-cart"></i>
                    </a>

                    <div className="dropdown">
                        <a
                            data-mdb-dropdown-init
                            className="text-reset me-3 dropdown-toggle hidden-arrow"
                            href="#"
                            id="navbarDropdownMenuLink"
                            role="button"
                            data-mdb-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <i className="fas fa-bell"></i>

                            <span className="badge rounded-pill badge-notification bg-danger">
                                1
                            </span>
                        </a>

                        <ul
                            className="dropdown-menu dropdown-menu-end"
                            aria-labelledby="navbarDropdownMenuLink"
                        >
                            <li>
                                <a className="dropdown-item" href="#">
                                    Some news
                                </a>
                            </li>

                            <li>
                                <a className="dropdown-item" href="#">
                                    Another news
                                </a>
                            </li>

                            <li>
                                <a className="dropdown-item" href="#">
                                    Something else here
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="dropdown">
                        <a
                            data-mdb-dropdown-init
                            className="dropdown-toggle d-flex align-items-center hidden-arrow"
                            href="#"
                            id="navbarDropdownMenuAvatar"
                            role="button"
                            data-mdb-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <img
                                src="https://mdbcdn.b-cdn.net/img/new/avatars/2.webp"
                                className="rounded-circle"
                                height="25"
                                alt="Profile"
                                loading="lazy"
                            />
                        </a>

                        <ul
                            className="dropdown-menu dropdown-menu-end"
                            aria-labelledby="navbarDropdownMenuAvatar"
                        >
                            <li>
                                <a className="dropdown-item" href="#">
                                    My profile
                                </a>
                            </li>

                            <li>
                                <a className="dropdown-item" href="#">
                                    Settings
                                </a>
                            </li>

                            <li>
                                <a className="dropdown-item" href="#">
                                    Logout
                                </a>
                            </li>
                        </ul>
                    </div>

                </div> */}
            </div>
        </nav>
    );
}

export default Navbar;
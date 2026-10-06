// import { useState, useEffect } from "react";
// import Compteur from "./components/Compteur";
// import DarkMode from "./components/DarkMode";
// import Login from "./pages/Login";
// import { useAppStore } from "./store/useAppStore";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Todos from "./pages/Todos";
import ProtectedRoute from "./components/ProtectedRoute";
// import Footer from "./layouts/Footer";
import Navbar from "./layouts/Navbar";
import Register from "./pages/Register";
import TodoShow from "./pages/TodoShow";
import TodoEdit from "./pages/TodoEdit";

function App() {
  // const [user, setUser] = useState(() => {
  //   const savedUser = localStorage.getItem("user");
  //   return savedUser ? JSON.parse(savedUser) : null;
  // });

  // useEffect(() => {
  //   if (user) {
  //     Storage.setItem("user", JSON.stringify(user));
  //   } else {
  //     localStorage.removeItem("user");
  //   }
  // }, [user]);

  // if (!user) {
  //   return <Login onLogin={setUser} />;
  // }

  // return <Profil user={user} onLogout={() => setUser(null)} />;

  // return <Compteur />
  // return <DarkMode />

  // const user = useAppStore((state) => state.user);
  // const setUser = useAppStore((state) => state.setUser);
  // const logout = useAppStore((state) => state.logout);

  // if (!user) {
  //   return <Login onLogin={setUser} />;
  // }

  // return <Profil user={user} onLogout={logout} />;
  return (
    <BrowserRouter>
      <div>
        <Navbar />
      </div>
      <Routes>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/register" element={<Register />}></Route>
        <Route path="/todos" element={<ProtectedRoute><Todos /></ProtectedRoute>}></Route>
        <Route path="/todos/:id/edit" element={<ProtectedRoute><TodoEdit /></ProtectedRoute>}></Route>
        <Route path="/todos/:id" element={<ProtectedRoute><TodoShow /></ProtectedRoute>}></Route>
        <Route path="*" element={<Navigate to="/todos" />}></Route>
      </Routes>
      {/* <div>
        <Footer />
      </div> */}
    </BrowserRouter>
  )
}

function Profil({ user, onLogout }) {
  return (
    <div>
      <h1>Salut {user.name}</h1>
      <button onClick={onLogout}>Déconnexion</button>
    </div>
  );
}

export default App;
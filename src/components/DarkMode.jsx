import { useAppStore } from "../stores/appStore";
// import { useState, useEffect } from "react";

function DarkMode() {
    // const [darkMode, setDarkMode] = useState(() => {
    //     const saveDarkMode = localStorage.getItem("darkMode");
    //     return saveDarkMode ? JSON.parse(saveDarkMode) : false;
    // });

    // useEffect(() => {
    //     localStorage.setItem("darkMode", JSON.stringify(darkMode));
    // }, [darkMode]);

    const darkMode = useAppStore((state) => state.darkMode);
    const toggleDark = useAppStore((state) => state.toggleDark);

    return (
        <div style={{ background: darkMode ? 'black' : 'white', color: darkMode ? 'white' : 'black', height: '100vh' }}>
            <button onClick={toggleDark}>Changer</button>
        </div>
    )
}

export default DarkMode;
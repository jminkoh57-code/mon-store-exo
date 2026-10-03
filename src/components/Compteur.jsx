import { useAppStore } from "../stores/appStore";
// import { useState, useEffect } from "react";

function Compteur() {
    // const [count, setCount] = useState(() => {
    //     const saveCount = localStorage.getItem("count");
    //     return saveCount ? JSON.parse(saveCount) : 0;
    // });

    // useEffect(() => {
    //     localStorage.setItem("count", JSON.stringify(count))
    // }, [count]);

    const count = useAppStore((state) => state.count);
    const increment = useAppStore((state) => state.increment);
    const decrement = useAppStore((state) => state.decrement);

    return (
        <div>
            <h1>Count : {count}</h1>
            <button onClick={increment}>+</button>
            <button onClick={decrement}>-</button>
        </div>
    )
}

export default Compteur;
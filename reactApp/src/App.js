import { useEffect, useState } from "react";
import { fetchData } from "./api";

function App() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchData().then(setData);
    }, []);

    return (
        <div>
            <h1>React ↔ Deno</h1>
            <p>{data ? data.message : "Loading..."}</p>
        </div>
    );
}

export default App;
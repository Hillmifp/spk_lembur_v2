import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import GenerateSPK from "./pages/GenerateSPK";
import History from "./pages/History";
import Statistik from "./pages/Statistik";

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/generate"
          element={<GenerateSPK />}
        />

        <Route
          path="/history"
          element={<History />}
        />

        <Route
          path="/statistik"
          element={<Statistik />}
        />

      </Routes>

    </BrowserRouter>

  );

}

export default App;
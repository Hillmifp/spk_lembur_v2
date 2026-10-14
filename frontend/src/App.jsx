
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
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

        {/* Rute utama Statistik */}
        <Route
          path="/statistik"
          element={<Statistik />}
        />

        {/* Alias untuk URL /statistics */}
        <Route
          path="/statistics"
          element={<Statistik />}
        />

        {/* Halaman yang tidak dikenal kembali ke Dashboard */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

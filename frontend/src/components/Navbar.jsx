import { Link } from "react-router-dom";

function Navbar() {

  return (

    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">

      <div className="container">

        <Link
          className="navbar-brand fw-bold"
          to="/"
        >
          SPK Lembur
        </Link>

        <div className="navbar-nav">

          <Link
            className="nav-link"
            to="/"
          >
            Dashboard
          </Link>

          <Link
            className="nav-link"
            to="/generate"
          >
            Generate
          </Link>

          <Link
            className="nav-link"
            to="/history"
          >
            History
          </Link>

          <Link
            className="nav-link"
            to="/statistik"
          >
            Statistik
          </Link>

        </div>

      </div>

    </nav>

  );

}

export default Navbar;
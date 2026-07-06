import {
  FaChartPie,
  FaFileAlt,
  FaHistory,
  FaChartBar
} from "react-icons/fa";

import { Link } from "react-router-dom";

function Sidebar() {

  return (

    <div className="sidebar">

      <div className="sidebar-header">

        <h4>

          SPK Lembur

        </h4>

      </div>

      <ul className="sidebar-menu">

        <li>

          <Link to="/">

            <FaChartPie />

            Dashboard

          </Link>

        </li>

        <li>

          <Link to="/generate">

            <FaFileAlt />

            Generate SPK

          </Link>

        </li>

        <li>

          <Link to="/history">

            <FaHistory />

            History

          </Link>

        </li>

        <li>

          <Link to="/statistik">

            <FaChartBar />

            Statistik

          </Link>

        </li>

      </ul>

    </div>

  );

}

export default Sidebar;
import Sidebar from "./Sidebar";

import "../styles/dashboard.css";

function Layout({

  children

}) {

  return (

    <div className="app-container">

      <Sidebar />

      <main className="content">

        {children}

      </main>

    </div>

  );

}

export default Layout;
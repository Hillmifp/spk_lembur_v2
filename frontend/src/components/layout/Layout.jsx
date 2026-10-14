import { useState } from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import "../../styles/layout.css";

function Layout({

    children,

    title = "Dashboard"

}) {

    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => {

        setCollapsed(!collapsed);

    };

    return (

        <div className="app">

            {/* ==========================
                SIDEBAR
            =========================== */}

            <Sidebar

                collapsed={collapsed}

            />

            {/* ==========================
                MAIN
            =========================== */}

            <div

                className={

                    collapsed

                        ? "main collapsed"

                        : "main"

                }

            >

                {/* ======================
                    TOPBAR
                ======================= */}

                <Topbar

                    title={title}

                    collapsed={collapsed}

                    toggleSidebar={toggleSidebar}

                />

                {/* ======================
                    CONTENT
                ======================= */}

                <main className="content fade-in">

                    <div className="page">

                        {children}

                    </div>

                </main>

                {/* ======================
                    FOOTER
                ======================= */}

                <footer className="footer">

                    <small>

                        SPK Lembur Management System

                        <br />

                        © {new Date().getFullYear()} —

                        Direktorat Jenderal HEKSP

                    </small>

                </footer>

            </div>

        </div>

    );

}

export default Layout;
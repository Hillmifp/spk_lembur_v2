import { NavLink } from "react-router-dom";

import {

    FaHome,

    FaFileAlt,

    FaHistory,

    FaChartBar,

    FaCog,

    FaChevronLeft,

    FaChevronRight,

    FaFileSignature

} from "react-icons/fa";

import "../../styles/sidebar.css";

function Sidebar({

    collapsed

}){

    const menus = [

        {

            title:"Dashboard",

            path:"/",

            icon:<FaHome/>

        },

        {

            title:"Generate SPK",

            path:"/generate",

            icon:<FaFileAlt/>

        },

        {

            title:"Riwayat SPK",

            path:"/history",

            icon:<FaHistory/>

        },

        {

            title:"Statistik",

            path:"/statistics",

            icon:<FaChartBar/>

        },

        {

            title:"Pengaturan",

            path:"/settings",

            icon:<FaCog/>

        }

    ];

    return(

        <aside

            className={

                collapsed

                ?

                "sidebar collapsed"

                :

                "sidebar"

            }

        >

            {/* ==========================
                LOGO
            ========================== */}

            <div className="sidebar-logo">

                <div className="logo-icon">

                    <FaFileSignature/>

                </div>

                {

                    !collapsed &&

                    <div className="logo-text">

                        <div className="logo-title">

                            SPK Lembur

                        </div>

                        <div className="logo-subtitle">

                            Management System

                        </div>

                    </div>

                }

            </div>

            {/* ==========================
                MENU
            ========================== */}

            <div className="sidebar-menu">

                <div className="menu-section">

                    MENU

                </div>

                {

                    menus.map((menu,index)=>(

                        <NavLink

                            key={index}

                            to={menu.path}

                            className={({isActive})=>

                                isActive

                                ?

                                "menu-item active"

                                :

                                "menu-item"

                            }

                            title={

                                collapsed

                                ?

                                menu.title

                                :

                                ""

                            }

                        >

                            <div className="menu-icon">

                                {menu.icon}

                            </div>

                            {

                                !collapsed &&

                                <span

                                    className="menu-text"

                                >

                                    {menu.title}

                                </span>

                            }

                        </NavLink>

                    ))

                }

            </div>

            {/* ==========================
                FOOTER
            ========================== */}

            <div className="sidebar-footer">

                {

                    !collapsed &&

                    <div className="footer-card">

                        <h4>

                            SPK Lembur

                        </h4>

                        <p>

                            Version 2.0

                        </p>

                    </div>

                }

            </div>

        </aside>

    );

}

export default Sidebar;
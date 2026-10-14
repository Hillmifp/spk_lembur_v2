import { useEffect, useState } from "react";

import {

    FaBars,

    FaSearch,

    FaBell,

    FaUserCircle

} from "react-icons/fa";

import "../../styles/topbar.css";

function Topbar({

    title,

    toggleSidebar

}){

    const [currentTime,setCurrentTime]=useState(new Date());

    useEffect(()=>{

        const timer=setInterval(()=>{

            setCurrentTime(new Date());

        },1000);

        return()=>clearInterval(timer);

    },[]);

    const tanggal=currentTime.toLocaleDateString(

        "id-ID",

        {

            weekday:"long",

            day:"numeric",

            month:"long",

            year:"numeric"

        }

    );

    const jam=currentTime.toLocaleTimeString(

        "id-ID",

        {

            hour:"2-digit",

            minute:"2-digit",

            second:"2-digit"

        }

    );

    return(

        <header className="topbar">

            {/* =======================
                LEFT
            ======================= */}

            <div className="topbar-left">

                <button

                    className="menu-toggle"

                    onClick={toggleSidebar}

                >

                    <FaBars/>

                </button>

                <div className="page-info">

                    <h2>

                        {title}

                    </h2>

                    <p>

                        Sistem Administrasi SPK Lembur

                    </p>

                </div>

            </div>

            {/* =======================
                RIGHT
            ======================= */}

            <div className="topbar-right">

                {/* SEARCH */}

                <div className="search-box">

                    <FaSearch

                        className="search-icon"

                    />

                    <input

                        type="text"

                        placeholder="Cari menu..."

                    />

                </div>

                {/* DATE */}

                <div className="topbar-date">

                    <div className="date-title">

                        {tanggal}

                    </div>

                    <div className="date-time">

                        {jam}

                    </div>

                </div>

                {/* NOTIFICATION */}

                <div className="topbar-icon">

                    <FaBell/>

                    <span

                        className="notification-dot"

                    ></span>

                </div>

                {/* USER */}

                <div className="user-box">

                    <div className="user-avatar">

                        <FaUserCircle/>

                    </div>

                    <div className="user-detail">

                        <div className="user-name">

                            Administrator

                        </div>

                        <div className="user-role">

                            Sistem SPK Lembur

                        </div>

                    </div>

                </div>

            </div>

        </header>

    );

}

export default Topbar;
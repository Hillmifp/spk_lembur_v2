function Button({

    children,

    onClick,

    type = "button",

    variant = "primary",

    disabled = false,

    icon,

    className = ""

}) {

    return (

        <button

            type={type}

            onClick={onClick}

            disabled={disabled}

            className={`btn btn-${variant} ${className}`}

        >

            {icon &&

                <span className="btn-icon">

                    {icon}

                </span>

            }

            {children}

        </button>

    );

}

export default Button;
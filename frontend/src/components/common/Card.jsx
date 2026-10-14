function Card({

    title,

    children,

    className = ""

}) {

    return (

        <div

            className={`card ${className}`}

        >

            {

                title &&

                <div className="card-header">

                    <h4>

                        {title}

                    </h4>

                </div>

            }

            <div className="card-body">

                {children}

            </div>

        </div>

    );

}

export default Card;
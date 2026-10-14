function Loading({

    text = "Memuat data..."

}) {

    return (

        <div className="loading-container">

            <div className="loading-spinner"></div>

            <p>{text}</p>

        </div>

    );

}

export default Loading;
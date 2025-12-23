import React from "react";
import Header from "../components/header/header";
import Footer from "../components/footer/footer";
import logo from "../react.svg"


function NotFoundPage(){
    return(
        <>
        <Header />
        <main>
        {/* <div className="home-aboutgap" id="home-aboutgap" style={{ height: "600px" }}></div> */}
        <div
        className="not-found"
        style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "850px",
            textAlign: "center"
        }}
        >
        <img src={logo} alt="Logo"   
            style={{
            width: "150px",
            height: "auto",
            marginBottom: "20px"
        }}/>
        <h1>Page Not Found.</h1>
        </div>

        </main>
        <Footer />
        </>
    );

}


export default NotFoundPage;
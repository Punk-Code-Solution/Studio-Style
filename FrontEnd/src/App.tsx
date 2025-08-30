import React from "react";
import LoginPage from "./pages/loginPage";
import Home from "./pages/homePage";
import { ToastContainer } from 'react-toastify';
import GlobalStyle from "./css/styles";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const App = () => {

    return(
        <>  
            <GlobalStyle />
           
                <BrowserRouter>
                    <Routes>
                        <Route path="/home" element={ <Home/> } />
                        <Route path="/" element={ <LoginPage/> } />
                    </Routes>
                </BrowserRouter>
            
            <ToastContainer />

        </>
    )

}

export default App
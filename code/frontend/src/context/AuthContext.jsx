import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("access_token"));
    const [isAuthenticated, setIsAuthenticated] = useState(!!token);

    useEffect(() => {
        setIsAuthenticated(!!token);
        if (token) {
            localStorage.setItem("access_token", token);
        } else {
            localStorage.removeItem("access_token");
        }
    }, [token]);

    const login = (newToken) => {
        setToken(newToken);
    };

    const logout = () => {
        setToken(null);
    };

    const value = {
        token,
        isAuthenticated,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

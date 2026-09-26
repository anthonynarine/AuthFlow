import React, { createContext, useContext, useEffect } from "react";
import { queryClient } from "../../app/queryClient";
import { SESSION_ENDED_EVENT } from "../../interceptors/axios";


// Importing the custom hook for basicAuthServices
import { useBasicAuth } from "../../hooks/useBasicAuth";


// Create context for basic authentication
const BasicAuthContext = createContext(undefined);

// Hook to easily access basicAuthServices within components
export function useBasicAuthServices() {
    // Access the context
    const context = useContext(BasicAuthContext);

 // Check against `undefined` to ensure the context is not just 'null' or falsy.
    if (context === undefined) { 
        throw new Error("useBasicAuthServices must be used within a BasicAuthProvider");
    }
    return context;
}

// Provider component for basic authentication
export function BasicAuthProvider({ children }) {
    // Access the basicAuthServices using the custom hook
    const basicAuthServices = useBasicAuth();
    const { setUser, setIsLoggedIn } = basicAuthServices;

    // The HTTP layer announces when the session is gone (refresh failed or
    // was revoked). Drop the signed-in state and every cached query, so no
    // organization's data outlives the session that was allowed to see it.
    useEffect(() => {
        const onSessionEnded = () => {
            setUser(null);
            setIsLoggedIn(false);
            queryClient.clear();
        };
        window.addEventListener(SESSION_ENDED_EVENT, onSessionEnded);
        return () => window.removeEventListener(SESSION_ENDED_EVENT, onSessionEnded);
    }, [setUser, setIsLoggedIn]);

    return (
        // Providing the basic auth services to the children components through context
        <BasicAuthContext.Provider value={basicAuthServices}>
            {children}
        </BasicAuthContext.Provider>
    );
}

// Exporting the default provider
export default BasicAuthProvider;



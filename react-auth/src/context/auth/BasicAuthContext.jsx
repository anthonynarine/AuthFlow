import React, { createContext, useContext } from "react";


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
    console.log("BasicAuthProvider rendered"); //  REMOVE FOR PRODUCTION

    // Access the basicSAuthServices using the custom hook
    const basicAuthServices = useBasicAuth();

    return (
        // Providing the basic auth services to the children components through context
        <BasicAuthContext.Provider value={basicAuthServices}>
            {children}
        </BasicAuthContext.Provider>
    );
}

// Exporting the default provider
export default BasicAuthProvider;



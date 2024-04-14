import React, { createContext, useContext } from "react";

// Importing the custom hook for basic auth services
import { useBasicAuth } from "../../components/hooks/useBasicAuth";

// Create context for basic authentication
const BasicAuthContext = createContext();

// Hook to easily access basic auth services within components
export function useBasicAuthServices() {
    // Access the context
    const context = useContext(BasicAuthContext);

    // If the context is not found, throw an error
    if (!context) {
        throw new Error("useBasicAuthServices must be used within a BasicAuthProvider");
    }
    return context;
}

// Provider component for basic authentication
export function BasicAuthProvider({ children }) {
    console.log("BasicAuthProvider rendered"); //  REMOVE FOR PRODUCTION

    // Access the basic auth services using the custom hook
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

import React, { createContext, useContext } from "react";

// Import the hook for twoFactorAuthServices
import { useTwoFactorAuth } from "../../hooks/useTwoFactorAuth";


// Create context
const TwoFactorAuthContext = createContext(null);

// Hook to easily acces twoFactorAuthServices within components
export function useTwoFactorAuthServices() {
    // Access the context
    const context = useContext(TwoFactorAuthContext)

 // Check against `undefined` to ensure the context is not just 'null' or falsy.
    if (context === null) { 
        throw new Error("useTwoFactorAuthServices must be within a TwoFactorAuthProvider")
    }
    return context;
}

// Provider component for two-factor authentiation
export function TwoFactorAuthProvider({ children }) {
    console.log("TwoFactorAuthProvider rendered") // REMOVE FOR PRODUCTION

    // Access the twoFactorAuthServices using the custom hook
    const twoFactorAuthServices = useTwoFactorAuth();

    return (
        <TwoFactorAuthContext.Provider value={twoFactorAuthServices}>
            {children}
        </TwoFactorAuthContext.Provider>
    );
}

// Export the default provider
export default TwoFactorAuthProvider;
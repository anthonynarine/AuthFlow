import React, { createContext, useContext } from "react";

// Import the hook for the userSessionService
import { useUserSession } from "../../hooks/useUserSession";

// Create context
const UserSessionContext = createContext(undefined);

// Hook to easily access userSessionServices within components
export function useUserSessionServices() {
    const context = useContext(UserSessionContext);

    if (context === undefined) {
        throw new Error("useUserSessionServices must be witin a UserSessionProvider");
    }
    return context;
}

// Provider component for session
export function UserSessionProvider({ children }) {
    console.log("UserSessionProvider rendered") // Remove for production

    const useUserSessionServices = useUserSession();

    return (
        <UserSessionContext.Provider value={useUserSessionServices}>
            {children}
        </UserSessionContext.Provider>
    );
}
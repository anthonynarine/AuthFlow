import { createContext, useContext, useMemo } from "react";
import { useAuth } from "../../components/hooks/useAuth";
import { useBasicAuth } from "../../components/hooks/useBasicAuth";
import { useTwoFactorAuth } from "../../components/hooks/useTwoFactorAuth";
import { useUserSession } from "../../components/hooks/useUserSession";


// Create context for basic authentication
const AuthContext = createContext(null);

// Hook to easily access basicAuthServices within components
export function useAuthServices() {
    const context = useContext(AuthContext);

    if (context === null) {
        throw new Error("useAuthServices must be used within an AuthProvider");
    }
    return context;
}

// Provider component for AuthServices
export function AuthProvider({ children }) {
    console.log("AuthProvider rendered"); // Consider removing this for production

    const userAuth = useAuth();
    const basicAuth = useBasicAuth();
    const session = useUserSession();
    const twoFactorAuth = useTwoFactorAuth();

    // use useMemo to only recompute the authServices objects when one of the hooks changes
    const authServices = useMemo(() => ({
        ...userAuth,
        basicAuth,
        twoFactorAuth,
        session,
    }), [userAuth, basicAuth, twoFactorAuth, session]);

    return (
        <AuthContext.Provider value={authServices}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;

import { createContext, useContext } from "react";
import { useAuth } from "../../components/hooks/useAuth";

/**
 * Create a Context for the authentication services.
 * This Context will be used to provide and consume authentication state and functions throughout the application.
 */
const AuthContext = createContext(null);

/**
 * Custom hook to use the authentication services.
 * This hook simplifies accessing the auth-related state and functions.
 * 
 * @returns {Object} The authentication services context.
 * @throws {Error} If called outside of AuthProvider component tree.
 */
export function useAuthServices() {
    const context = useContext(AuthContext);

    if (context === null) {
        throw new Error("useAuthServices must be used within an AuthProvider");
    }
    return context;
}

/**
 * Provider component for authentication services.
 * Wraps the application or part of it that requires authentication state and functions.
 * Utilizes the useAuth custom hook to manage auth state.
 * 
 * @param {Object} children - The child components or elements to be wrapped by the provider.
 */
export function AuthProvider({ children }) {
    console.log("AuthProvider rendered"); // Consider removing this for production

    const authServices = useAuth();

    return (
        <AuthContext.Provider value={authServices}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;

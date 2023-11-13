import { useAuth } from "@clerk/clerk-react";
import { getAuthToken } from "./api";


const AuthTokenComp = () => {
    const { userId } = useAuth();

    if (userId) {
        getAuthToken(userId)
            .then(token => { localStorage.setItem('authToken', token) })
        return null;
    }

    return null;
}

export default AuthTokenComp;
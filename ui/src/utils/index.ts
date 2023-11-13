import jwt_decode from "jwt-decode";

const verifyToken = (token: string) => {
    try {
        if (!token) {
            // if the token is empty just return an empty stuff :)
            throw new Error("The token is empty");
        }

        const { exp } = jwt_decode(token) as any;

        // if the token is expired just exit :)
        return Date.now() >= exp * 1000 ? null : token
    } catch (error) {

        return null;
    }
}

export default verifyToken

export function parseResponse(response: {
    data: any
}) {
    return response?.data?.data;
}
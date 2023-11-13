import axios from "axios";
import { parseResponse } from "../../utils";

export async function getAuthToken(credential: string): Promise<string>{
    return axios.post(`/auth/authenticate`, { user_reference: credential }).then(res => parseResponse(res)?.authToken as string)
}
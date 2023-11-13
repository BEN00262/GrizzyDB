import { useGoogleLogin } from '@react-oauth/google';
import { add_auth_token, useGrizzyDBDispatch, useGrizzyDBState } from "../context"
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const useLoginWithGoogleAuth = () => {
    const dispatch = useGrizzyDBDispatch();
    const navigate = useNavigate();

    return {
        login: useGoogleLogin({
            onSuccess: tokenResponse => {
                console.log(tokenResponse)

                axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenResponse.access_token}`, {
                    headers: {
                        Authorization: `Bearer ${tokenResponse.access_token}`,
                        Accept: 'application/json'
                    }
                }).then(({ data }) => {
                    console.log(data)
                })

                // add_auth_token(dispatch, tokenResponse.access_token);
                // navigate('/dashboard');
            },
        })
    }
}

export const useActiveDatabase = () => {
    const { active_database, databases } = useGrizzyDBState();

    return { active_database: databases?.[active_database] };
}
import { Dispatch, useReducer } from 'react';
import { createContainer } from 'react-tracked';
import { IAction, IDatabaseDisplay, IGrizzyDBGlobalState } from './types';
import reducer from './reducer';
import { ACTION_ADD_DATABASE, ACTION_CAPTURE_FINGERPRINT, ACTION_INITIALIZE_DATABASES, ACTION_REMOVE_DATABASE, ACTION_SWITCH_ACTIVE_DATABASE, ACTION_SWITCH_AUTH_TOKEN } from './action_types';
import axios from 'axios';
import verifyToken from '../utils';


const initial_state: IGrizzyDBGlobalState = {
    databases: [],
    active_database: 0,
    auth_token: verifyToken(localStorage.getItem('authToken') ?? ""),
    user_fingerprint: localStorage.getItem('user_fingerprint')
}

const useValue = () => useReducer(reducer, initial_state);

// export some functions
export function change_fingerprint(dispatch: Dispatch<IAction>, user_fingerprint: string) {
    dispatch({
        type: ACTION_CAPTURE_FINGERPRINT,
        payload: user_fingerprint
    })
}

export function add_auth_token(dispatch: Dispatch<IAction>, auth_token: string) {
    dispatch({
        type: ACTION_SWITCH_AUTH_TOKEN,
        payload: auth_token
    })
}

export function initialize_databases(dispatch: Dispatch<IAction>, databases: IDatabaseDisplay[]) {
    dispatch({
        type: ACTION_INITIALIZE_DATABASES,
        payload: databases
    })
}

export function add_database(dispatch: Dispatch<IAction>, database: IDatabaseDisplay) {
    dispatch({
        type: ACTION_ADD_DATABASE,
        payload: database
    })
}

export function remove_database(dispatch: Dispatch<IAction>, reference: string) {
    dispatch({
        type: ACTION_REMOVE_DATABASE,
        payload: reference
    })
}

export function switch_active_database(dispatch: Dispatch<IAction>, index: number) {
    dispatch({
        type: ACTION_SWITCH_ACTIVE_DATABASE,
        payload: index
    })
}


// intercept the axios and set the headers
axios.defaults.baseURL = import.meta.env.VITE_MAIN_SERVER_ENDPOINT;

axios.interceptors.request.use(
    onRequest => {
        if (!onRequest.headers['x-access-token']) {
            const authToken = localStorage.getItem('authToken');

            if (authToken) {
                onRequest.headers['x-access-token'] = authToken;
            }
        }

        return onRequest;
    },

    error => Promise.reject(error)
)


export const {
    Provider: GrizzyDBProvider,
    useTrackedState: useGrizzyDBState,
    useUpdate: useGrizzyDBDispatch,
} = createContainer(useValue);
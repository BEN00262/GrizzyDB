import { ACTION_ADD_DATABASE, ACTION_CAPTURE_FINGERPRINT, ACTION_INITIALIZE_DATABASES, ACTION_REMOVE_DATABASE, ACTION_SWITCH_ACTIVE_DATABASE, ACTION_SWITCH_AUTH_TOKEN } from "./action_types";
import { IAction, IDatabaseDisplay, IGrizzyDBGlobalState } from "./types";

export default (state: IGrizzyDBGlobalState, action: IAction) => {

    switch(action.type) {
        case ACTION_CAPTURE_FINGERPRINT:
            {
                const local_state = { ...state };
                const fingerprint = action.payload as string;

                local_state.user_fingerprint = fingerprint;
                localStorage.setItem("user_fingerprint", fingerprint);
                return local_state;
            }

        case ACTION_SWITCH_AUTH_TOKEN:
            {
                const local_state = { ...state };
                const auth_token = action.payload as string;

                local_state.auth_token = auth_token;
                localStorage.setItem("authToken", auth_token);
                return local_state;
            }

        case ACTION_INITIALIZE_DATABASES:
            {
                {
                    const local_state = { ...state };
    
                    local_state.databases = (action.payload ?? []) as IDatabaseDisplay[];
    
                    return local_state;
                }
            }

        case ACTION_SWITCH_ACTIVE_DATABASE:
            {
                const local_state = { ...state };

                local_state.active_database = (action.payload ?? 0) as number;

                return local_state;
            }
            

        case ACTION_ADD_DATABASE:
            {
                const local_state = { ...state };
                local_state.databases.push(action.payload as IDatabaseDisplay);
                return local_state;
            }

        case ACTION_REMOVE_DATABASE:
            {
                const local_state = { ...state };

                const index = local_state.databases.findIndex(
                    x => x._id === action.payload
                );

                local_state.databases.splice(index, 1);
                return local_state;
            }
    }

    return state;
}
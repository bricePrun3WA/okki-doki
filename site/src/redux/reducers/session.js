import { CONNEXION, DECONNEXION } from "../constants/session-actions";

// SOURCE de vérité du state de session
let stateSessionInit;
if (localStorage.getItem('isLogged')) {
    stateSessionInit = {
        isLogged: JSON.parse(localStorage.getItem('isLogged')) || false
    };
} else {
    stateSessionInit = {
        isLogged: false
    }
}

let reducerSession = (state = stateSessionInit, action = {}) => {
    if (action.payload && action.payload.e) {
        action.payload.e.preventDefault();
    }

    // Gestion des actions du reducer de session
    switch (action.type) {
        case CONNEXION:
            if (action?.payload?.isLogged) {
                let isLogged;
                switch (action?.payload?.espace) {
                    case "client":
                        isLogged = {
                            admin: state?.isLogged?.admin || false,
                            client: true
                        };
                        break;
                    case "admin":
                        isLogged = {
                            admin: true,
                            client: state?.isLogged?.admin || false
                        };
                        break;
                    default:
                        isLogged = {
                            ...(state?.isLogged || { admin: false, client: false })
                        };
                        break;
                }

                return {
                    ...state,
                    isLogged: isLogged
                }
            }
            break;
        case DECONNEXION:
            if (action?.payload?.done === 'ok') {
                let isLogged;
                switch (action?.payload?.espace) {
                    case "client":
                        isLogged = {
                            admin: state?.isLogged?.admin || false,
                            client: false
                        };
                        break;
                    case "admin":
                        isLogged = {
                            admin: false,
                            client: state?.isLogged?.admin || false
                        };
                        break;
                    default:
                        isLogged = {
                            ...(state?.isLogged || { admin: false, client: false })
                        };
                        break;
                }

                return {
                    ...state,
                    isLogged: isLogged
                }
            }
            break;
        default:
            return state;
    }

    return state;
}

export default reducerSession;
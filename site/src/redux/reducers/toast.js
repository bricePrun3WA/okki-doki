import { FADE_TOAST, HIDE_TOAST, SHOW_TOAST } from "../constants/toast-actions";


// SOURCE de vérité du state de session
let stateSessionInit = {
    isVisible: false,
    isFadingOut: false,
    type: '',
    message: <></>
};

let reducerToast = (state = stateSessionInit, action = {}) => {
    if (action?.payload?.e) {
        action.payload.e.preventDefault();
    }

    // Gestion des actions du reducer de session
    switch (action.type) {
        // Affiche la notif avec le bon coloris et un message personnalisé
        case SHOW_TOAST:
            let toastType = 'primary';
            if (action?.payload?.type) {
                toastType = action.payload.type;
            }

            return {
                ...state,
                isVisible: true,
                isFadingOut: false,
                type: toastType,
                message: action?.payload?.message
            }
            break;

            // Affiche la notif avec le bon coloris et un message personnalisé
            case FADE_TOAST:    
                return {
                    ...state,
                    isFadingOut: true
                }
                break;

        // Cache le message en vidant les infos
        case HIDE_TOAST:
            return stateSessionInit;
            break;

        default:
            return state;
    }

    return state;
}

export default reducerToast;
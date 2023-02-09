import { Outlet } from "react-router-dom";
import { RENDER_LOAD, INIT_LOAD, SHOW_MESSAGE_LOAD } from "../constants/load-actions";


// SOURCE de vérité du state de chargement
let stateLoadInit = {
    isReady: false,
    content:
        <div className="padding text-center">
            <div className="spin material-icons load-icon">cached</div>
        </div>
};

let reducerLoad = (state = stateLoadInit, action = {}) => {
    if (action?.payload?.e) {
        action.payload.e.preventDefault();
    }

    // Gestion des actions du reducer de chargement de page
    switch (action.type) {
        // CHARGEMENT EN COURS
        case INIT_LOAD:
            return {
                isReady: false,
                content:
                    <div className="padding text-center">
                        <div className="spin material-icons load-icon">cached</div>
                    </div>
            }
            break;

        // Renvoie un simple composant à afficher pour la page
        // (Utile pour les erreurs d'accès à une page si on a pas les droits)
        case SHOW_MESSAGE_LOAD:
            return {
                isReady: true,
                content: (
                    <>
                        {action?.payload?.content}
                    </>
                )
            }
            break;

        // Renvoie la suite de la page à afficher
        case RENDER_LOAD:
            return {
                isReady: true,
                content: (
                    <>
                        <Outlet />
                    </>
                )
            }
            break;

        default:
            return state;
    }

    return state;
}

export default reducerLoad;
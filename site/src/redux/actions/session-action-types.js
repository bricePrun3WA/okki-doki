import { CONNEXION, DECONNEXION } from "../constants/session-actions";

///////////////////
// LOGIN
///////////////////
const connexion = payload => {
    return {
        type: CONNEXION, payload
    }
};

const deconnexion = payload => {
    return {
        type: DECONNEXION, payload
    }
};

export {
    connexion,
    deconnexion
}
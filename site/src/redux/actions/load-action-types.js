import { INIT_LOAD, SHOW_MESSAGE_LOAD, RENDER_LOAD } from "../constants/load-actions";

///////////////////
// CHARGEMENT DES PAGES
///////////////////
const initLoad = payload => {
    return {
        type: INIT_LOAD, payload
    }
};

const showMessageLoad = payload => {
    return {
        type: SHOW_MESSAGE_LOAD, payload
    }
};

const renderLoad = payload => {
    return {
        type: RENDER_LOAD, payload
    }
};

export {
    initLoad,
    showMessageLoad,
    renderLoad
}
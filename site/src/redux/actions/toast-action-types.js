import { FADE_TOAST, HIDE_TOAST, SHOW_TOAST } from "../constants/toast-actions";

///////////////////
// GESTION DES NOTIFICATIONS
///////////////////
const showToast = payload => {
    return {
        type: SHOW_TOAST, payload
    }
};

const fadeToast = payload => {
    return {
        type: FADE_TOAST, payload
    }
};

const hideToast = payload => {
    return {
        type: HIDE_TOAST, payload
    }
};

export {
    showToast,
    fadeToast,
    hideToast
}
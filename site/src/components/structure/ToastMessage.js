import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fadeToast } from "../../redux/actions/toast-action-types";

// Message d'information temporaire
const ToastMessage = () => {

    // State de session via Redux
    const { myReducerToast } = useSelector(state => {
        return {
            myReducerToast : state.reducerToast
        }
    });
    const dispatch = useDispatch();

    // Timer pour cacher le toast à partir d'un certain temps 
    const [timeoutHide, setTimeoutHide] = useState(false);

    // Gestion du timer pour cacher le toast
    useEffect(() => {
        if (timeoutHide !== false) {
            clearTimeout(timeoutHide);
        }
        const newTimeoutHide = setTimeout(() => {
            dispatch(fadeToast());
        }, 7000);
        setTimeoutHide(newTimeoutHide);
    }, [myReducerToast]);

    // Gestion du type de fenêtre en fonction de l'info voulue
    // ERREUR, SUCCES, AVERTISSEMENT
    let typeMsg = "box %TYPE%-box" + (myReducerToast.isFadingOut ? ' fade-out' : ' fade-in');
    if (myReducerToast.isVisible) {
        switch (myReducerToast.type) {
            case 'success':
                typeMsg = typeMsg.replaceAll('%TYPE%', 'primary');
                break;
            case 'warning':
                typeMsg = typeMsg.replaceAll('%TYPE%', 'secondary');
                break;
            case 'danger':
                typeMsg = typeMsg.replaceAll('%TYPE%', 'danger');
                break;
            default:
                typeMsg = typeMsg.replaceAll('%TYPE%', 'primary');
                break;
        }
    }

    // Contenu du toast
    return (
        <>
            {myReducerToast.isVisible && (
                <aside id="modalNotif" className={typeMsg}>
                    {myReducerToast.message}
                </aside>
            )}
        </>
    );
}

export default ToastMessage;
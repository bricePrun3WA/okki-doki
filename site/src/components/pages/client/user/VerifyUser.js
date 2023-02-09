import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import { showToast } from "../../../../redux/actions/toast-action-types";

const VerifyUser = () => {

    // ID utilisateur pour valider les infos
    const { id, key } = useParams();

    // Hooks pour gérer les notifications et la redirection
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        // Requête d'API pour valider le compte
        let reqValidateUser = new Request('/user/confirm', {
            method: 'POST',
            body: JSON.stringify({
                id: id,
                key: key
            }),
            headers: { 'content-type': 'application/json' },
        });
        
        // Effectue la requête
        fetch(reqValidateUser)
            .then(res => res.json())
            .then(data => {

                // Erreur
                if (data?.hasError) {
                    dispatch(showToast({
                        type : "danger",
                        message: data?.errorMsg
                    }));
                    return;
                }

                // OK
                if (data === "OK") {
                    dispatch(showToast({
                        type : "primary",
                        message: "Utilisateur validé."
                    }));
                    navigate("/login");

                // Erreur
                } else {
                    dispatch(showToast({
                        type : "danger",
                        message: "Erreur lors de la validation."
                    }));
                }
            });
    }, []);

    // Contenu de la page de validation de compte
    return (
        <div className="text-center">
            <div className="spin material-icons load-icon">cached</div>
            <div>Validation en cours...</div>
        </div>
    )
}

export default VerifyUser;
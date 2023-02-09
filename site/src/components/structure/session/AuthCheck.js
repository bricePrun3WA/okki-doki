import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Outlet, useLocation } from "react-router-dom";

import { deconnexion } from "../../../redux/actions/session-action-types";
import { initLoad, renderLoad, showMessageLoad } from "../../../redux/actions/load-action-types";
import NoAuth from "./NoAuth";

// Composant de détection des droits utilisateurs
const AuthCheck = (props) => {

    // Récupération de la session
    const { myReducerSession, myReducerLoad } = useSelector(state => {
        return {
            myReducerSession : state.reducerSession,
            myReducerLoad : state.reducerLoad
        }
    });
    
    // Gestionnaires divers pour l'URL et les states Redux (session et chargement notamment)
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {

        // Chargement de la page
        dispatch(initLoad({}));

        // Si connecté
        if (myReducerSession.isLogged) {

            // On vérifie si un rôle est demandé pour accéder à la page
            const role = props?.roleRequired || 'superadmin'
            const reqCheckSession = new Request(`/check-session`, {
                method: 'POST',
                body: JSON.stringify({
                    espace: role
                }),
                headers: { 'content-type': 'application/json' },
            });

            // Check par requête
            let isValid = false;
            let noAuth = false;
            fetch(reqCheckSession)
                .then(res => res.json())
                .then(data => {
                    isValid = data?.isValid;
                    noAuth = data?.noAuth;
                    const needLogout = data?.needLogout;

                    // Si le token de session n'est plus valide => on déconnecte de suite
                    if (!isValid && needLogout) {
                        const reqLogout = new Request(`/logout`, {
                            method: 'POST',
                            body: JSON.stringify({
                                espace: props.espace
                            }),
                            headers: { 'content-type': 'application/json' },
                        });
                        fetch(reqLogout)
                            .then(res => res.json())
                            .then(dataLogout => {
                                if (!dataLogout?.hasError) {
                                    dispatch(deconnexion({ done: "ok", espace: props.espace }));
                                }
                            })
                            .catch(err => {
                                //console.log(err);
                            });
                    
                    // Erreur: Afficher une page particulière
                    } else if (!isValid && noAuth) {
                        dispatch(showMessageLoad({
                            content: <NoAuth />
                        }));
                    }
                })
                .then(data => {
                    // Si valide, on accède à la page
                    if (isValid) {
                        //dispatch(renderLoad({}));
                        dispatch(renderLoad({
                            content: <><Outlet /></>
                        }));
                    
                    // Pas valide & besoin d'une authentification = redirection vers la page de connexion
                    } else if (!noAuth && location.pathname !== "/login") {
                        navigate(props.espace === "admin" ? "/admin/login" : "/login");
                    }
                });
        } else {

            // Page accessible = Récupération de la page à afficher
            dispatch(renderLoad({
                content: <><Outlet /></>
            }));
        }
    }, [location]);

    return (
        <>
            {myReducerLoad.content}
        </>
    );
};

export default AuthCheck;
import { useState } from "react";
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { hideToast, showToast } from "../../../../redux/actions/toast-action-types";
import { connexion } from "../../../../redux/actions/session-action-types";

function ClientLogin(props) {
    // Récupération des élément de session placé dans le provider Redux
    const { reducerSession } = useSelector(state => {
        return {
            reducerSession : state.reducerSession
        }
    });

    // Champ du formulaire de connexion
    const [user, setUser] = useState({
        email: '',
        pwd: '',
        espace: 'client'
    });
    
    // Gestions des notifications et de la navigation
    let dispatch = useDispatch();
    const navigate = useNavigate();

    // Modification des données du formulaire de connexion
    const handleChange = (e) => {
        e.preventDefault();

        setUser({
            ...user,
            [e.target.name]: e.target.value
        });
    }

    // Validation des données: connexion CLIENT
    const submitLogin = (e, user) => {
        e.preventDefault();
        
        // On réinitialise le toast
        dispatch(hideToast({
            type: "",
            message: ""
        }));

        // Params manquants
        if (!user.email || !user.pwd) {
            dispatch(showToast({
                type: "danger",
                message: "Un des champs n'est pas renseigné."
            }));
            return;
        }
        
        // Requête API: connexion utilisateur
        let reqLogin = new Request('/login', {
            method: 'POST',
            body: JSON.stringify(user),
            headers: { 'content-type': 'application/json' },
        });
        
        // Appel de la requête
        fetch(reqLogin)
            .then(res => res.json())
            .then(data => {
                // Erreur lors de la connexion
                if (data.hasError) {
                    dispatch(showToast({
                        type: "danger",
                        message: data.errorMsg
                    }));
                    return;
                // Connexion effectuée
                } else if (data?.isLogged) {
                    dispatch(connexion({isLogged: true, espace: "client"}));
                }
            })
            // Redirection vers la page d'accueil lors de la validation de connexion
            .then(result => {
                if (reducerSession?.isLogged?.client) {
                    navigate('/');
                }
            })
            // Erreur de conneixon
            .catch(err => {
                console.log(err);
                dispatch(showToast({
                    type: "danger",
                    message: "Une erreur est survenue, veuillez réessayer ultérieurement."
                }));
                return;
            });
    }

    // Contenu du formulaire de connexion
    return (
        <section className="row">
            <article className="column">
                <h1 className="text-center no-margin">Connexion</h1>
                <form method="post" className="white-box" onSubmit={(e) => { submitLogin(e, user) }}>
                    <div className="margin">
                        <label htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" className="inputUser" value={user.email} onChange={handleChange} />
                    </div>
                    <div className="margin">
                        <label htmlFor="pwd">Mot de passe</label>
                        <input id="pwd" name="pwd" type="password" className="inputUser" value={user.pwd} onChange={handleChange} />
                    </div>
                    <div className="margin text-center">
                        <NavLink to="/inscription">
                            S'inscrire
                        </NavLink>
                    </div>
                    
                    <div className="margin text-center">
                        <button className="btn btn-primary" type="submit">
                            VALIDER
                        </button>
                    </div>
                </form>
            </article>
        </section>
    );
}

export default ClientLogin;
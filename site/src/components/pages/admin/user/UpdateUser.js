import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { NavLink, useParams } from 'react-router-dom';
import { hideToast, showToast } from "../../../../redux/actions/toast-action-types";

function UpdateUser(props) {
    // ID de l'utilisateur à sécuriser
    const { id } = useParams();

    // Champs renseignés pour ajouter un user
    const [formdata, setFormdata] = useState({
        id: id,
        name: '',
        surname: '',
        email: '',
        phone: '',
        birthdate: '',

        address: '',
        suburb: '',
        cp: '',
        city: '',

        pwd: '',
        dupPwd: ''
    });
    const [userName, setUserName] = useState("");
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    const dispatch = useDispatch();

    useEffect(() => {
        
        // Requête d'API pour l'ajout d'un utilisateur
        let reqGetUser = new Request('/user/get', {
            method: 'POST',
            body: JSON.stringify({
                id : id
            }),
            headers: { 'content-type': 'application/json' },
        });

        fetch(reqGetUser)
            .then(res => res.json())
            .then(data => {
                if (!data.hasError) {
                    const birthDate = new Date(data.birthDate).toISOString().split('T')[0]

                    // Mise à jour des informations
                    setFormdata({
                        ...formdata,

                        name: data.name,
                        surname: data.surname,
                        email: data.email,
                        phone: data.phone,
                        birthdate: birthDate,
                
                        address: data?.adresse?.address,
                        suburb: data?.adresse?.suburb,
                        cp: data?.adresse?.cp,
                        city: data?.adresse?.city,
                    });

                    // Mise à jour du nom utilisateur rentré avant modification
                    setUserName(data?.name + ' ' + (data?.surname || '').toUpperCase());

                    setIsLoadingUser(false);
                } else {
                    dispatch(showToast({
                        type : "danger",
                        message: data.errorMsg
                    }));
                }
            });
    }, []);

    // Evènement de changement de value pour un input
    const changeFormdataElt = (e) => {
        e.preventDefault();

        setFormdata({
            ...formdata,
            [e.target.name]: e.target.value
        });
    }

    // Validation du formulaire d'ajout d'utilisateur
    const submitAddUser = (e) => {
        e.preventDefault();
        dispatch(hideToast());

        // Requête d'API pour l'ajout d'un utilisateur
        let reqAddUser = new Request('/user/update', {
            method: 'POST',
            body: JSON.stringify(formdata),
            headers: { 'content-type': 'application/json' },
        });
        
        // Effectue la requête
        fetch(reqAddUser)
            .then(res => res.json())
            .then(data => {
                console.log(data);
                if (data.hasError) {
                    dispatch(showToast({
                        type : "danger",
                        message: data.errorMsg
                    }));
                    return;
                }

                // Redirige la page si ça s'est bien passé 
                if (data === 'OK') {
                    dispatch(showToast({
                        type : "success",
                        message: "Utilisateur bien mis à jour."
                    }));
                } else {
                    dispatch(showToast({
                        type : "danger",
                        message: "Une erreur est survenue, veuillez réessayer ultérieurement."
                    }));
                }
                return;
            })
            .catch(err => {
                dispatch(showToast({
                    type : "danger",
                    message: "Une erreur est survenue, veuillez réessayer ultérieurement."
                }));
            });
    }

    // Affichage du chargement des informations de l'utilisateur sélectionné précédemment
    if (isLoadingUser) {
        return (
            <div className="text-center">
                <span className="spin material-icons load-icon">cached</span>
            </div>
        );
    }

    return (
        <section className="row">
            <article className="column">
                <h1 className="text-center no-margin">Modifier l'utilisateur "{userName}"</h1>
                <div className="text-left">
                    <NavLink to="/admin/users" className="btn btn-primary btn-icons btn-action">
                        <span className="material-icons">chevron_left</span>
                        <span> RETOUR</span> 
                    </NavLink>
                </div>

                {/******** Forumaire de modification d'informations classique **********/}
                <form method="post" className="container" onSubmit={submitAddUser}>
                    <div className="row white-box flex-align-bl">
                        <div className="column">
                            <h2 className="no-margin">Informations générales</h2>
                            <div className="margin">
                                <label htmlFor="name">Prénom <b className="text-primary">*</b></label>
                                <input type="text" id="name" name="name" value={formdata.name} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="surname">Nom <b className="text-primary">*</b></label>
                                <input type="text" id="surname" name="surname" value={formdata.surname} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="email">Adresse mail <b className="text-primary">*</b></label>
                                <input type="email" id="email" name="email" value={formdata.email} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="phone">Numéro de téléphone <b className="text-primary">*</b></label>
                                <input type="text" id="phone" name="phone" value={formdata.phone} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="birthdate">Date de naissance <b className="text-primary">*</b></label>
                                <input type="date" id="birthdate" name="birthdate" value={formdata.birthdate} onChange={changeFormdataElt} />
                            </div>

                            {/******** Pour les changements de mot de passe: valider 2 fois la saisie **********/}
                            <div className="margin">
                                <label htmlFor="pwd">Mot de passe <b className="text-primary">*</b></label>
                                <input type="password" id="pwd" name="pwd" value={formdata.pwd} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="dupPwd">Répéter le mot de passe <b className="text-primary">*</b></label>
                                <input type="password" id="dupPwd" name="dupPwd" value={formdata.dupPwd} onChange={changeFormdataElt} />
                            </div>
                        </div>
                        <div className="column">
                            <h2 className="no-margin">Adresse</h2>
                            <div className="margin">
                                <label htmlFor="address">Adresse <b className="text-primary">*</b></label>
                                <input type="text" id="address" name="address" value={formdata.address} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="suburb">Complément d'adresse </label>
                                <input type="text" id="suburb" name="suburb" value={formdata.suburb} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="cp">Code postal <b className="text-primary">*</b></label>
                                <input type="text" id="cp" name="cp" value={formdata.cp} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="city">Ville <b className="text-primary">*</b></label>
                                <input type="text" id="city" name="city" value={formdata.city} onChange={changeFormdataElt} />
                            </div>
                        </div>
                    </div>

                    {/* Bouton "Modifier l'utilisateur" */}
                    <div className="text-right">
                        <input type="submit" className="btn btn-primary" value="VALIDER" />
                    </div>
                </form>
            </article>
        </section>
    );
}

export default UpdateUser;
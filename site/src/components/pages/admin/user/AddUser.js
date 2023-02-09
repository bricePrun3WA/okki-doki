import { useState } from "react";
import { useDispatch } from "react-redux";
import { NavLink, useNavigate } from 'react-router-dom';
import { showToast } from "../../../../redux/actions/toast-action-types";

function AddUser(props) {
    // Champs renseignés pour ajouter un user
    const [formdata, setFormdata] = useState({
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

    // Pour les redirections
    const navigate = useNavigate();
    const dispatch = useDispatch();

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

        // Requête d'API pour l'ajout d'un utilisateur
        let reqAddUser = new Request('/user/add', {
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
                        message: "Utilisateur ajouté."
                    }));
                    navigate('/admin/users');
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
                return;
            });
    }

    return (
        <section className="row">
            <article className="column">
                <h1 className="text-center no-margin">Ajouter un utilisateur</h1>
                <div className="text-left">
                    <NavLink to="/admin/users" className="btn btn-primary btn-icons btn-action">
                        <span className="material-icons">chevron_left</span>
                        <span> RETOUR</span> 
                    </NavLink>
                </div>
                <form method="post" className="container" onSubmit={submitAddUser}>
                    <div className="row white-box flex-align-bl">
                        <div className="column">
                            <h2 className="no-margin">Informations générales</h2>
                            <div className="margin">
                                <label htmlFor="name">Prénom <b className="text-primary">*</b></label>
                                <input type="text" name="name" value={formdata.name} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="surname">Nom <b className="text-primary">*</b></label>
                                <input type="text" name="surname" value={formdata.surname} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="email">Adresse mail <b className="text-primary">*</b></label>
                                <input type="text" name="email" value={formdata.email} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="phone">Numéro de téléphone <b className="text-primary">*</b></label>
                                <input type="text" name="phone" value={formdata.phone} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="birthdate">Date de naissance: </label>
                                <input type="date" name="birthdate" value={formdata.birthdate} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="pwd">Mot de passe <b className="text-primary">*</b></label>
                                <input type="password" name="pwd" value={formdata.pwd} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="dupPwd">Répéter le mot de passe <b className="text-primary">*</b></label>
                                <input type="password" name="dupPwd" value={formdata.dupPwd} onChange={changeFormdataElt} />
                            </div>
                        </div>
                        <div className="column">
                            <h2 className="no-margin">Adresse</h2>
                            <div className="margin">
                                <label htmlFor="name">Adresse <b className="text-primary">*</b></label>
                                <input type="text" name="address" value={formdata.address} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="name">Complément d'adresse: </label>
                                <input type="text" name="suburb" value={formdata.suburb} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="name">Code postal <b className="text-primary">*</b></label>
                                <input type="text" name="cp" value={formdata.cp} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="name">Ville <b className="text-primary">*</b></label>
                                <input type="text" name="city" value={formdata.city} onChange={changeFormdataElt} />
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <input type="submit" className="btn btn-primary" value="VALIDER" />
                    </div>
                </form>
            </article>
        </section>
    );
}

export default AddUser;
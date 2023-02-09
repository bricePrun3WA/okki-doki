import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { NavLink, useNavigate } from 'react-router-dom';

import Select from "react-select";
import { dayOptions } from "../../../../misc/include";
import { hideToast, showToast } from "../../../../redux/actions/toast-action-types";

function AddCompany(props) {

    // Champs renseignés
    const [formdata, setFormdata] = useState({
        name: "",
        email: "",
        phone: "",
        
        address: "",
        suburb: "",
        cp: "", 
        city: "",
        country: "France",

        mainUser: null,
        users: [],

        horaires: []
    });

    // Liste des horaires rentrés
    const [myHoraires, setMyHoraires] = useState([]);

    // Données de la liste des utilisateurs, et state de chargement de celles-ci
    const [listUsers, setListUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Utilisé pour les redirections
    const navigate = useNavigate();

    // Utilisé pour la notification
    const dispatch = useDispatch();
    
    // Au chargement de la page...
    useEffect(() => {
        setIsLoadingUsers(true);

        // On exécute la requête en API listant les utilisateurs
        fetch("/user/list/simple")
            .then(res => res.json())
            .then(data => {
                const arrayData = [];
                for (const aUser of data) {

                    // Conversion en options pour une liste déroulante
                    arrayData.push({
                        label: `${aUser.name} ${aUser.surname.toUpperCase()}`,
                        value:  aUser._id
                    });
                }
                setListUsers(arrayData);
                setIsLoadingUsers(false);
            })
            .catch(err => {
                return;
            });
    }, []);

    // Variable tampon (pour gérer les valeurs par défaut des nouveaux horaires) 
    useEffect(() => {
        setMyHoraires(formdata.horaires.length > 0 ?
                formdata.horaires
            :
                [{
                    days: [],
                    hourStart: "",
                    hourEnd: ""
                }]
        );
    }, [formdata.horaires]);

    // Evènement de changement de value pour un input
    const changeFormdataElt = (e) => {
        e.preventDefault();

        setFormdata({
            ...formdata,
            [e.target.name]: e.target.value
        });
    }

    // Gestion de la sélection pour la sélection multiple (dans ce cas, pour users)
    const handleSelectUsers = (inputs, arrayData) => {
        console.log(inputs.filter(option => option.value === "all"));

        // Mise à jour des valeurs cochées
        const values = (inputs.length
                            && (inputs.filter(option => option.value === "all").length > 0) ?
                arrayData
            :
                inputs
        );

        setFormdata({
            ...formdata,
            users: values
        });
    }

    // Validation du formulaire d'ajout d'utilisateur
    const submitAddCompany = (e) => {
        e.preventDefault();

        dispatch(hideToast({
            type: "",
            message: ""
        }));

        // Requête d'API pour l'ajout d'un utilisateur
        let reqAddCompany = new Request('/company/add', {
            method: 'POST',
            body: JSON.stringify(formdata),
            headers: { 'content-type': 'application/json' },
        });
        
        // Effectue la requête
        fetch(reqAddCompany)
            .then(res => res.json())
            .then(data => {
                if (data.hasError) {
                    dispatch(showToast({
                        type: "danger",
                        message: data.errorMsg
                    }));
                    return;
                }

                // Redirige la page si ça s'est bien passé 
                if (data === 'OK') {
                    dispatch(showToast({
                        type: 'success',
                        message: 'Entreprise ajoutée.'
                    }));
                    navigate('/admin/companies');
                } else {
                    dispatch(showToast({
                        type: "danger",
                        message: "Une erreur est survenue, veuillez réessayer ultérieurement."
                    }));
                }
                return;
            })
            .catch(err => {
                dispatch(showToast({
                    type: "danger",
                    message: "Une erreur est survenue, veuillez réessayer ultérieurement."
                }));
                return;
            });
    }
    
    return (
        <section className="row">
            <article className="column">
                <h1 className="text-center no-margin">Ajouter une entreprise</h1>
                <div className="text-left">
                    <NavLink to="/admin/companies" className="btn btn-primary btn-icons btn-action">
                        <span className="material-icons">chevron_left</span>
                        <span> RETOUR</span> 
                    </NavLink>
                </div>

                {/******** Formulaire: ajout d'une entreprise **********/}
                <form method="post" className="container" onSubmit={submitAddCompany}>
                    <div className="row white-box flex-align-bl">
                        <div className="column">
                            {/******** INFORMATIONS TYPE NOM, MAIL... **********/}
                            <h2 className="no-margin">Général</h2>
                            <div className="margin">
                                <label htmlFor="name">Nom <b className="text-primary">*</b></label>
                                <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formdata.name}
                                        onChange={changeFormdataElt}
                                    />
                            </div>
                            <div className="margin">
                                <label htmlFor="email">Email <b className="text-primary">*</b></label>
                                <input type="email" id="email" name="email" value={formdata.email} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="phone">Numéro de téléphone <b className="text-primary">*</b></label>
                                <input type="text" id="phone" name="phone" value={formdata.phone} onChange={changeFormdataElt} />
                            </div>
                            {/******************/}
                            
                            {/******** UTILISATEURS **********/}
                            <div className="margin">
                                <label htmlFor="mainUser">Utilisateur principal</label>            
                                <Select
                                        isClearable
                                        isDisabled={isLoadingUsers}
                                        isLoading={isLoadingUsers}
                                        placeholder='-'
                                        noOptionsMessage={() => 'Aucun résultat'}
                                        onChange={(input) => {
                                                setFormdata({
                                                    ...formdata,
                                                    mainUser: input
                                                });
                                            }}
                                        options={listUsers}
                                        ariaLabelledBy="mainUser"
                                        name="mainUser"
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        value={formdata.mainUser}
                                    />
                            </div>
                            <div className="margin">
                                <label htmlFor="users">Utilisateurs</label>                        
                                <Select
                                    isClearable
                                    isMulti
                                    isDisabled={isLoadingUsers}
                                    isLoading={isLoadingUsers}
                                    placeholder='-'
                                    noOptionsMessage={() => 'Aucun résultat'}
                                    onChange={(inputs) => { handleSelectUsers(inputs, listUsers); }}
                                    options={[
                                                {
                                                    label: "Tout sélectionner",
                                                    value: "all"
                                                },
                                                ...listUsers
                                            ]}
                                    ariaLabelledBy="users"
                                    name="users"
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    value={formdata.users}
                                />
                            </div>
                            {/******************/}
                        </div>
                        <div className="column">
                            {/******** ADDRESSE COMPLÈTE **********/}
                            <h2 className="no-margin">Adresse</h2>
                            <div className="margin">
                                <label htmlFor="address">Adresse <b className="text-primary">*</b></label>
                                <input type="text" id="address" name="address" value={formdata.address} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="suburb">Complément d'adresse: </label>
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
                            {/******************/}
                        </div>
                    </div>
                    <div className="row white-box flex-align-bl">
                        <div className="column">
                            <h2 className="no-margin">Horaires</h2>
                            {
                                // Liste des horaires renseignés tout le long de l'ajout
                                myHoraires.map((aDispo, i) =>
                                    <div key={i}>
                                        {/* Bouton "Supprimer l'horaire" */}
                                        {i > 0 && (
                                            <div className="row flex-align-bl">
                                                <div className="column text-right">
                                                    <button
                                                            className="btn btn-danger btn-action"
                                                            onClick={e => {
                                                                e.preventDefault();

                                                                const newHoraires = myHoraires;
                                                                newHoraires.splice(i, 1)

                                                                setFormdata({
                                                                    ...formdata,
                                                                    horaires: newHoraires
                                                                });
                                                            }}>
                                                        <span className="material-icons">
                                                            close
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {/********************/}
                                        
                                        {/*
                                          * Gestions des jours et heures pour une plage horaire
                                          * À noter qu'il faudra renseigner 2 horaires différents pour plusieurs plages le même jour
                                          * 
                                          * EXEMPLE: les LUNDI / MARDI / MERCREDI: de 9h à 12h,
                                          * puis autre horaire les LUNDI / MARDI / MERCREDI: de 14h à 19h (pause entre midi et deux)
                                          */}
                                        <div className="row flex-align-bl">
                                            <div className="column margin">
                                                <label htmlFor={`horairesDays${i}`}>Jours <b className="text-primary">*</b></label>
                                                <Select
                                                    isClearable
                                                    isMulti
                                                    placeholder='-'
                                                    menuPlacement="auto"
                                                    noOptionsMessage={() => 'Aucun résultat'}
                                                    onChange={(input) => {
                                                            const newHoraires = myHoraires;
                                                            newHoraires[i].days = input;

                                                            setFormdata({
                                                                ...formdata,
                                                                horaires: newHoraires
                                                            });
                                                        }}
                                                    options={dayOptions}
                                                    ariaLabelledBy={`horairesDays${i}`}
                                                    name="horairesDays[]"
                                                    className="react-select-container"
                                                    classNamePrefix="react-select"
                                                    value={aDispo.days}
                                                />
                                            </div>
                                            <div className="column">
                                                <div className="margin">
                                                    <label htmlFor={`horairesHStart${i}`}>Ouverture <b className="text-primary">*</b></label>
                                                    <input
                                                        type="time"
                                                        step="300"
                                                        id={`horairesHStart${i}`}
                                                        name="horairesHStart[]"
                                                        value={aDispo.hourStart}
                                                        onChange={(e) => {
                                                            const newHoraires = myHoraires;
                                                            newHoraires[i].hourStart = e.target.value;

                                                            setFormdata({
                                                                ...formdata,
                                                                horaires: newHoraires
                                                            });
                                                        }}
                                                        required />
                                                </div>
                                                <div className="margin">
                                                    <label htmlFor={`horairesHEnd${i}`}>Fermeture <b className="text-primary">*</b></label>
                                                    <input
                                                        type="time"
                                                        step="300"
                                                        id={`horairesHEnd${i}`}
                                                        name="horairesHEnd[]"
                                                        value={aDispo.hourEnd}
                                                        onChange={(e) => {
                                                            const newHoraires = myHoraires;
                                                            newHoraires[i].hourEnd = e.target.value;

                                                            setFormdata({
                                                                ...formdata,
                                                                horaires: newHoraires
                                                            });
                                                        }}
                                                        required />
                                                </div>
                                            </div>
                                        </div>
                                        {i < (myHoraires.length-1) && <hr/>}
                                        {/********************/}
                                    </div>
                                )
                            }
                        </div>
                    </div>
                    
                    {/* Bouton "Ajouter un nouvel horaire = on ajoute  */}
                    <div className="row">
                        <div className="column text-center">
                            <button
                                    className="btn btn-danger"
                                    onClick={e => {
                                        e.preventDefault();

                                        const newHoraires = myHoraires;
                                        newHoraires.push({
                                            days: [],
                                            hourStart: "",
                                            hourEnd: ""
                                        });

                                        setFormdata({
                                            ...formdata,
                                            horaires: newHoraires
                                        });
                                    }}>
                                <div className="row">
                                    <span className="column material-icons">add</span>
                                    <div className="column">NOUVEL HORAIRE</div>
                                </div>
                            </button>
                        </div>
                    </div>
                    {/************************/}

                    {/* Bouton "Ajouter l'entrepise" */}
                    <div className="text-right">
                        <input type="submit" className="btn btn-primary" value="VALIDER" />
                    </div>
                </form>
            </article>
        </section>
    );
}

export default AddCompany;
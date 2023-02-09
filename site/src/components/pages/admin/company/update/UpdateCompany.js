import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { NavLink, useParams } from 'react-router-dom';

import Select from "react-select";
import { hideToast, showToast } from "../../../../../redux/actions/toast-action-types";

function UpdateCompany(props) {
    // ID de l'utilisateur à sécuriser
    const { id } = useParams();

    // States de chargement des éléments en BDD
    const [isLoadingCompany, setIsLoadingCompany] = useState(true);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    // Liste des utilisateurs
    const [listUsers, setListUsers] = useState([]);

    // Champs renseignés
    const [formdata, setFormdata] = useState({
        id: id,
        typeInfos : "general",
        isSuperAdmin: false,

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
    const [companyName, setCompanyName] = useState("");

    // Gestionnaire des states de Redux
    const dispatch = useDispatch();
    
    // Récupération des données d'utilisateur au chargement de la page
    useEffect(() => {
        // Requête d'API pour récupérer l'utilisateur
        let reqGetCompany = new Request('/company/get', {
            method: 'POST',
            body: JSON.stringify({
                id : id
            }),
            headers: { 'content-type': 'application/json' },
        });

        // Exécution
        fetch(reqGetCompany)
            .then(res => res.json())
            .then(data => {
                if (data.hasError) {
                    dispatch(showToast({
                        type: "danger",
                        message: data.errorMsg
                    }));
                    return;
                }

                // Informations et branchement des données
                const myCompany = data?.company;
                const formdataUpdated = {
                    ...formdata,

                    name: myCompany?.name,
                    email: myCompany?.email || "",
                    phone: myCompany?.phone || "",

                    address: myCompany?.adresse?.address,
                    suburb: myCompany?.adresse?.suburb,
                    cp: myCompany?.adresse?.cp,
                    city: myCompany?.adresse?.city
                }
                setCompanyName(myCompany?.name);

                // Si SUPER ADMIN = possibilité de gérer les utilisateurs
                if (data?.isSuperAdmin) {

                    // Utilisateur principal
                    let mainUser = {};
                    if (myCompany?.mainUser) {
                        mainUser = {
                            label: `${myCompany?.mainUser.name} ${myCompany?.mainUser.surname.toUpperCase()}`,
                            value: myCompany?.mainUser._id
                        };
                    }

                    // Utilisateurs de l'entreprise
                    const users = [];
                    if (Array.isArray(myCompany?.users)) {
                        for (const aUser of myCompany?.users) {
                            users.push({
                                label: `${aUser.name} ${aUser.surname.toUpperCase()}`,
                                value: aUser._id
                            });
                        }
                    }

                    formdataUpdated.mainUser = mainUser;
                    formdataUpdated.users = users;
                    formdataUpdated.isSuperAdmin = true;
                }

                // Mise à jour des informations
                setFormdata(formdataUpdated);
                setIsLoadingCompany(false);

                // Récupération de la liste des utilisateurs
                if (formdataUpdated?.isSuperAdmin) {
                    fetch("/user/list/simple")
                        .then(res => res.json())
                        .then(data => {
                            const arrayData = [];
                            for (const aUser of data) {
                                arrayData.push({
                                    label: `${aUser.name} ${aUser.surname.toUpperCase()}`,
                                    value:  aUser._id
                                });
                            }
                            setListUsers(arrayData);
                        })
                        .then(data => {
                            setIsLoadingUsers(false);
                        })
                        .catch(err => {
                            return;
                        });
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

    // Gestion de la sélection multiple des utilisateurs dans le select
    const handleSelectMult = (inputs, arrayData) => {
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
    const submitUpdateCompany = (e) => {
        e.preventDefault();

        dispatch(hideToast({
            type: "",
            message: ""
        }));

        // Requête d'API pour l'ajout d'un utilisateur
        let reqUpdateCompany = new Request('/company/update', {
            method: 'POST',
            body: JSON.stringify(formdata),
            headers: { 'content-type': 'application/json' },
        });
        
        // Effectue la requête
        fetch(reqUpdateCompany)
            .then(res => res.json())
            .then(data => {
                if (data.hasError) {
                    dispatch(showToast({
                        type: "danger",
                        message: data.errorMsg
                    }));
                    return;
                }
                
                // Affiche le résultat de la mise à jour via l'API
                if (data && data.isDone === 'OK') {
                    dispatch(showToast({
                        type : "success",
                        message: "Entreprise mise à jour."
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
                    type: "danger",
                    message: "Une erreur est survenue, veuillez réessayer ultérieurement."
                }));
                return;
            });
    }

    // Affichage du chargement des informations de l'entreprise sélectionnée précédemment
    if (isLoadingCompany) {
        return (
            <div className="text-center">
                <span className="spin material-icons load-icon">cached</span>
            </div>
        );
    }

    return (
        <section className="row">
            <article className="column">
                <h1 className="text-center no-margin">
                    <div>Modifier l'entreprise</div>
                    <div>"{companyName}"</div>
                </h1>
                <div className="text-left">
                    <NavLink to="/admin/companies" className="btn btn-primary btn-icons btn-action">
                        <span className="material-icons">chevron_left</span>
                        <span> RETOUR</span> 
                    </NavLink>
                </div>
                <form method="post" className="container" onSubmit={submitUpdateCompany}>
                    {/******** Onglets de navigation pour la modification d'informations d'entreprise **********/}
                    <ul className="row flex-align-bl tabs">
                        <NavLink
                                className={({ isActive }) => "text-no-underline "+(isActive ? "active" : "")}
                                to={"/admin/company/update/general/"+id}>
                            
                            <li className="tab">
                                GÉNÉRAL
                            </li>
                        </NavLink>
                        <NavLink
                                className={({ isActive }) => "text-no-underline "+(isActive ? "active" : "")}
                                to={"/admin/company/update/hours/"+id}>
                            <li className="tab">
                                HORAIRES / RDV
                            </li>
                        </NavLink>
                    </ul>
                    {/******************/}
                    <div className="row white-box flex-align-bl">
                        <div className="column">
                            {/******** Informations type NOM, MAIL... **********/}
                            <h2 className="no-margin">Informations générales</h2>
                            <div className="margin">
                                <label htmlFor="nameUpdate">Nom <b className="text-primary">*</b></label>
                                <input
                                        type="text"
                                        id="nameUpdate"
                                        name="name"
                                        value={formdata.name}
                                        onChange={changeFormdataElt}
                                    />
                            </div>
                            <div className="margin">
                                <label htmlFor="emailUpdate">Email <b className="text-primary">*</b></label>
                                <input type="email" id="emailUpdate" name="email" value={formdata.email} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="phoneUpdate">Numéro de téléphone <b className="text-primary">*</b></label>
                                <input type="text" id="phoneUpdate" name="phone" value={formdata.phone} onChange={changeFormdataElt} />
                            </div>
                            {/******************/}

                            {/******** Gestion des utilisateurs si SUPER ADMIN **********/}
                            {formdata.isSuperAdmin && (
                                <>
                                    <div className="margin">
                                        <label htmlFor="mainUserUpdate">Utilisateur principal</label>            
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
                                                ariaLabelledBy="mainUserUpdate"
                                                name="mainUser"
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                value={formdata.mainUser}
                                            />
                                    </div>  
                                    
                                    <div className="margin">
                                        <label htmlFor="usersUpdate">Utilisateurs</label>                        
                                        <Select
                                            isClearable
                                            isMulti
                                            isDisabled={isLoadingUsers}
                                            isLoading={isLoadingUsers}
                                            placeholder='-'
                                            noOptionsMessage={() => 'Aucun résultat'}
                                            onChange={(inputs) => { handleSelectMult(inputs, listUsers); }}
                                            options={[
                                                        {
                                                            label: "Tout sélectionner",
                                                            value: "all"
                                                        },
                                                        ...listUsers
                                                    ]}
                                            ariaLabelledBy="usersUpdate"
                                            name="users"
                                            className="react-select-container"
                                            classNamePrefix="react-select"
                                            value={formdata.users}
                                        />
                                    </div>
                                </>
                            )}
                            {/******************/}
                        </div>
                        
                        {/******** ADDRESSE COMPLÈTE **********/}
                        <div className="column">
                            <h2 className="no-margin">Adresse</h2>
                            <div className="margin">
                                <label htmlFor="addressUpdate">Adresse <b className="text-primary">*</b></label>
                                <input type="text" id="addressUpdate" name="address" value={formdata.address} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="suburbUpdate">Complément d'adresse: </label>
                                <input type="text" id="suburbUpdate" name="suburb" value={formdata.suburb} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="cpUpdate">Code postal <b className="text-primary">*</b></label>
                                <input type="text" id="cpUpdate" name="cp" value={formdata.cp} onChange={changeFormdataElt} />
                            </div>
                            <div className="margin">
                                <label htmlFor="cityUpdate">Ville <b className="text-primary">*</b></label>
                                <input type="text" id="cityUpdate" name="city" value={formdata.city} onChange={changeFormdataElt} />
                            </div>
                        </div>
                        {/******************/}
                    </div>

                    {/* Bouton "Modifier l'entrepise" */}
                    <div className="text-right">
                        <input type="submit" className="btn btn-primary" value="VALIDER" />
                    </div>
                </form>
            </article>
        </section>
    );
}

export default UpdateCompany;
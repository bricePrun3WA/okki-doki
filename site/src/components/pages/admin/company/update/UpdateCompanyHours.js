import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { NavLink, useParams } from 'react-router-dom';

import Select from "react-select";
import { dayOptions } from "../../../../../misc/include";
import { hideToast, showToast } from "../../../../../redux/actions/toast-action-types";

function UpdateCompanyHours(props) {
    // ID de l'utilisateur à sécuriser
    const { id } = useParams();

    // Champs renseignés
    const [formdata, setFormdata] = useState({
        id: id,
        typeInfos : "hours",

        name: '',
        horaires: [],
        multipleEvents: false,
        lengthEvent: 1
    });
    const [isLoadingCompany, setIsLoadingCompany] = useState(true);

    // Liste des horaires rentrés
    const [myHoraires, setMyHoraires] = useState([]);

    const dispatch = useDispatch();
    
    useEffect(() => {
        // Requête d'API pour l'ajout d'un utilisateur
        let reqGetCompany = new Request('/company/get', {
            method: 'POST',
            body: JSON.stringify({
                id : id
            }),
            headers: { 'content-type': 'application/json' },
        });

        fetch(reqGetCompany)
            .then(res => res.json())
            .then(data => {
                const company = data?.company;

                if (!data.hasError && company) {
                    let mainUser = {};
                    if (data.mainUser) {
                        mainUser = {
                            label: `${company.mainUser.name} ${company.mainUser.surname.toUpperCase()}`,
                            value: company.mainUser._id
                        };
                    }

                    const horaires = [];
                    if (Array.isArray(company.horaires)) {
                        for (const horaire of company.horaires) {
                            const newHoraire = {
                                days: [],
                                hourStart: "",
                                hourEnd: ""
                            };
                
                            // Pour tous les jours à un horaire donné...
                            for (const horaireDay of horaire.days) {
                                // Récupération du label en fonction des jours sélectionnés
                                let labelValue = "";
                                switch (horaireDay) {
                                    case 1:
                                        labelValue = "Lundi";
                                        break;
                                    case 2:
                                        labelValue = "Mardi";
                                        break;
                                    case 3:
                                        labelValue = "Mercredi";
                                        break;
                                    case 4:
                                        labelValue = "Jeudi";
                                        break;
                                    case 5:
                                        labelValue = "Vendredi";
                                        break;
                                    case 6:
                                        labelValue = "Samedi";
                                        break;
                                    case 0:
                                        labelValue = "Dimanche";
                                        break;
                                    default:
                                        break;
                                }

                                // On récupère le jour et sa valeur sur une semaine (de 0 = dimanche à 6 = samedi)
                                newHoraire.days.push({
                                    label: labelValue,
                                    value: horaireDay
                                });
                            }

                            newHoraire.hourStart = horaire.hourStart;
                            newHoraire.hourEnd = horaire.hourEnd;
                
                            horaires.push(newHoraire);
                        }
                    }

                    // Mise à jour des informations
                    setFormdata({
                        ...formdata,

                        name: company?.name,
                        horaires: horaires,
                        multipleEvents: !!company?.multipleEvents,
                        lengthEvent: company?.lengthEvent || 1
                    });
                    
                    setIsLoadingCompany(false);
                }
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

    // Evènement de changement de value pour un input
    const checkFormdataElt = (e) => {
        setFormdata({
            ...formdata,
            [e.target.name]: (e.target?.checked ? e.target.value : '')
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

    // Chargement des informations des 
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
                    <div>"{formdata?.name}"</div>
                </h1>
                <div className="text-left">
                    <NavLink to="/admin/companies" className="btn btn-primary btn-icons btn-action">
                        <span className="material-icons">chevron_left</span>
                        <span> RETOUR</span> 
                    </NavLink>
                </div>
                <form method="post" className="container" onSubmit={submitUpdateCompany}>
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
                    <div className="row white-box flex-align-bl">
                        <div className="column">
                            <h2 className="no-margin">Rendez-vous</h2>
                            
                            <div className="row">
                                <div className="column margin">
                                    <label htmlFor="lengthEvent">Durée des rendez-vous <b className="text-primary">*</b></label>
                                    <input type="number" min="1" max="8" name="lengthEvent" value={formdata.lengthEvent} onChange={changeFormdataElt} />
                                </div>
                                
                                <div className="column row margin">
                                    <div className="padding">
                                        <input type="checkbox" name="multipleEvents"
                                                value="on" checked={!!(formdata?.multipleEvents) ? 'checked' : ''}
                                                onChange={checkFormdataElt} />
                                    </div>
                                    <div>Plusieurs rendez-vous possibles au même moment</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row white-box flex-align-bl">
                        <div className="column">
                            <h2 className="no-margin">Horaires</h2>
                            {
                                myHoraires.map((aDispo, i) =>
                                    <div key={i}>
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
                                        <div className="row flex-align-bl">
                                            <div className="column margin">
                                                <label>Jours ({aDispo.days.length})<b className="text-primary">*</b></label>
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
                                                    name="horairesDays[]"
                                                    className="react-select-container"
                                                    classNamePrefix="react-select"
                                                    value={aDispo.days}
                                                />
                                            </div>
                                            <div className="column">
                                                <div className="margin">
                                                    <label>Ouverture <b className="text-primary">*</b></label>
                                                    <input
                                                        type="time"
                                                        step="300"
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
                                                    <label>Fermeture <b className="text-primary">*</b></label>
                                                    <input
                                                        type="time"
                                                        step="300"
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
                                        {i < (myHoraires.length-1) && (<hr/>)}
                                    </div>
                                )
                            }
                        </div>
                    </div>
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
                    <div className="text-right">
                        <input type="submit" className="btn btn-primary" value="VALIDER" />
                    </div>
                </form>
            </article>
        </section>
    );
}

export default UpdateCompanyHours;
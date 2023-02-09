import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import Select from "react-select";
import { connexion } from "../../../../redux/actions/session-action-types";
import { hideToast, showToast } from "../../../../redux/actions/toast-action-types";
import AuthCheck from "../../../structure/session/AuthCheck";

function AddEvent(props) {
    // Champs renseignés
    const [formdata, setFormdata] = useState({
        company: "",
        week: "",
        hours: "",

        name: "",
        surname: "",
        email: "",
        phone: "",
        ... JSON.parse(localStorage.getItem('clientAddEvent'))
    });
    
    // Champ de formulaire de connexion CLIENT
    const [modalLogin, setModalLogin] = useState({
        opened: false,

        espace: "client",
        email: "",
        pwd: ""
    });
    
    // State de connexionclient (à revérifier lors du submit de la demande de RDV)
    const [clientSession, setClientSession] = useState({
        isChecked: false,
        isLogged : false
    });

    // Champs renseignés pour ajouter un user
    const [companiesList, setCompaniesList] = useState([]);
    const [weekList, setWeekList] = useState([]);
    const [hoursList, setHoursList] = useState([]);

    // States des chargement de données
    const [isLoadingWeek, setIsLoadingWeek] = useState(true);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
    const [isLoadingHours, setIsLoadingHours] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // State pour vérifier si l'envoi d'une requête est déjà en cours
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Hooks pour gérer les notification et la redirection vers la page de confirmation
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Liste des entreprises
    const getCompanies = () => {
        fetch("/company/list/simple")
            .then(res => res.json())
            .then(data => {
                if (data.hasError) {
                    dispatch(showToast({
                        type: "danger",
                        message: data.errorMsg
                    }));
                    setIsLoadingCompanies(false);
                    return;
                }

                // Conversion en options pour une liste déroulante
                const companiesData = [];
                for (const aCompany of data) {
                    companiesData.push({
                        label: `${aCompany.name}`,
                        value:  aCompany._id
                    });
                }

                setCompaniesList(companiesData);
                setIsLoadingCompanies(false);
            })
            .catch(err => {
                // Erreur de chargement des entreprises = NOTIF
                dispatch(showToast({
                    type: "danger",
                    message: "Erreur de chargement des entreprises."
                }));
                setIsLoadingCompanies(false);
            });
    }

    // Fonction visant à vérifiersi la session connectée est toujours valide
    const isValidClientSession = () => {
        return new Promise((resolve, reject) => {

            // Requête API pour véirifer la connexion
            let reqCheckSession = new Request('/check-session', {
                method: 'POST',
                body: JSON.stringify({
                    espace: "client"
                }),
                headers: { 'content-type': 'application/json' },
            });

            // Exécution de la requête
            fetch(reqCheckSession)
                .then(res => res.json())
                .then(checkData => {
                    // Erreur de requête
                    if (checkData.hasError) {
                        dispatch(showToast({
                            type: "danger",
                            message: checkData.errorMsg
                        }));
                        
                        resolve({
                            isValid: false
                        });
                    
                    // Session non valide
                    } else if (checkData?.isValid === false) {
                        resolve({
                            isValid: false
                        });

                    // Session valide
                    } else {

                        // Récupération des informations client pour les envoyer au formulaire
                        fetch("/profile/client/get")
                            .then(res => res.json())
                            .then(userInfos => {
                                resolve({
                                    isValid: true,
                                    user: userInfos
                                });
                            }).catch(err => {
                                dispatch(showToast({
                                    type: "danger",
                                    message: "Erreur de la récupération des informations client"
                                }));
            
                                resolve({
                                    isValid: false
                                });
                            });
                    }
                }).catch(err => {
                    dispatch(showToast({
                        type: "danger",
                        message: "Erreur de la récupération de session client"
                    }));

                    resolve({
                        isValid: false
                    });
                });
        });
    }

    // Fonction gérant la génération des options semaine par semaine
    const loadWeeks = () => {

        // Tableaux des options 
        const weekOptionsList = [];

        // Dernière date possible
        const lastPossibleDate = new Date();
        lastPossibleDate.setHours(23, 59, 59, 999);
        lastPossibleDate.setFullYear(lastPossibleDate.getFullYear()+1);

        // Réinitialisation des options
        setIsLoadingWeek(true);
        setWeekList(weekOptionsList);

        // Récupération du lundi de cette semaine
        let dateMonday = new Date('2023-02-06T00:00:00.000Z');
        if (dateMonday.getDay() !== 1) {
            dateMonday.setDate(dateMonday.getDate() - (dateMonday.getDay() - 1));
        }

        // Pour chaque date d'aujourd'hui à la fin de semaine
        for (let dateToCheck = dateMonday;
                dateToCheck < lastPossibleDate.getTime();
                dateToCheck.setDate(dateToCheck.getDate() + 7)) {

            // Premier jour de la semaine: DU..
            const firstDay = new Date(dateToCheck)
            firstDay.setDate(dateToCheck.getDate() - dateToCheck.getDay()+1);
            const firstDateVal = firstDay.toISOString().split("T")[0];
            const firstDateStr = firstDateVal.split("-").reverse().join("/");

            // Dernier jour de la semaine: AU..
            const lastDay = new Date(dateToCheck);
            lastDay.setDate(dateToCheck.getDate() - dateToCheck.getDay()+7);
            const lastDateVal = lastDay.toISOString().split("T")[0];
            const lastDateStr = lastDateVal.split("-").reverse().join("/");
            
            // Ajout dans les options de la liste déroulante
            weekOptionsList.push ({
                label: `Du ${firstDateStr} au ${lastDateStr}`,
                value: `${firstDateVal}_${lastDateVal}`
            });
        }

        // Mise à jour du state d'options
        setWeekList(weekOptionsList);
        setIsLoadingWeek(false);
    }

    // Récupération des horaires de RDV possibles
    const getEvents = () => {
        return new Promise((resolve, reject) => {

            // Pas d'entreprise sélectionnée
            if (!formdata?.company?.value) {
                dispatch(showToast({
                    type: "danger",
                    message: "Entreprise non précisée."
                }));
                resolve(false);
            }

            // Pas de semaine sélectionnée
            if (!formdata?.week?.value) {
                dispatch(showToast({
                    type: "danger",
                    message: "Période non précisée."
                }));
                resolve(false);
            }

            // Récupération via l'API des horaires ENTREPRISE / HORAIRES d'ouverture
            let reqHours = new Request('/company/hours', {
                method: 'POST',
                body: JSON.stringify({
                    beginDate: formdata.week.value.split("_")[0],
                    endDate: formdata.week.value.split("_")[1],
                    company: formdata.company
                }),
                headers: { 'content-type': 'application/json' },
            });

            // Exécution de la recherche des horaires
            fetch(reqHours)
                .then(res => res.json())
                .then(horairesData => {

                    // Erreur lors de la récupération 
                    if (horairesData.hasError) {
                        dispatch(showToast({
                            type: "danger",
                            message: horairesData.errorMsg
                        }));
                        
                        setIsLoadingHours(false);
                        resolve("NOK");
                    } else {

                        // Récupération des données dans un tableau et conversion en Date() et horaires formatés
                        const hourOptions = [];
                        for (let aDispo of horairesData?.possibleEvents) {
                            const {hourStart, hourEnd} = aDispo;
                            const hourStartDate = new Date(hourStart);
                            const hourEndDate = new Date(hourEnd);

                            const dateEvent = hourStartDate.toISOString().split("T")[0].split("-").reverse().join("/");
                            const hourStartArray = hourStartDate.toISOString().split("T")[1].split(":");
                            const hourEndArray = hourEndDate.toISOString().split("T")[1].split(":");
                            hourOptions.push({
                                label: `${dateEvent}, de ${hourStartArray[0]}h${hourStartArray[1]} à ${hourEndArray[0]}h${hourEndArray[1]}`,
                                value: `${hourStartDate.toISOString()}_${hourEndDate.toISOString()}`
                            });
                        }

                        // Mise à jours des options d'horaires et de chargement
                        setHoursList(hourOptions || []);
                        setIsLoadingHours(false);
                        resolve("OK");
                    }
                }).catch(err => { 

                    // Erreur générale
                    dispatch(showToast({
                        type: "danger",
                        message: "Erreur de la récupération des disponibilités"
                    }));
                    
                    setIsLoadingHours(false);
                });
        });
    }

    // Au chargement de la page...
    useEffect(() => {

        // On génère les semaines à chercher
        loadWeeks();

        // On récupère les entreprises
        getCompanies();

        // On checke la session si connecté
        isValidClientSession()
            .then (data => {
                setClientSession({
                    isChecked: true,
                    isLogged: data?.isValid || false,
                    user: data?.user
                });
            });
    }, []);

    // Récupération des horaires à chaque changement de semaine
    useEffect(() => {
        if (!formdata?.week?.value) {
            return;
        }
        getEvents();
    }, [formdata.week]);

    // Enregistrement des données lors de la réactualisation de la page
    useEffect(() => {
        localStorage.setItem('clientAddEvent', JSON.stringify(formdata));
    }, [formdata]);

    // On met à jour le state de chargement minimum pour prendre RDV
    useEffect(() => {
        if (isLoadingCompanies) {
            setIsLoading(false);
        }
    }, [isLoadingCompanies, isLoadingHours]);

    // Evènement de changement de value pour un input
    const changeFormdataElt = (e) => {
        e.preventDefault();

        setFormdata({
            ...formdata,
            [e.target.name]: e.target.value
        });
    }
    const changeModalLoginForm = (e) => {
        e.preventDefault();

        setModalLogin({
            ...modalLogin,
            [e.target.name]: e.target.value
        });
    }

    // Envoi de formulaire de connexion client
    const submitLogin = (e) => {
        e.preventDefault();
        
        dispatch(hideToast());
        if (!modalLogin.email || !modalLogin.pwd) {
            dispatch(showToast({
                type: "danger",
                message: "Un des champs est vide."
            }));
            return;
        }
        
        // Requête d'API de connexion
        let reqLogin = new Request('/login', {
            method: 'POST',
            body: JSON.stringify(modalLogin),
            headers: { 'content-type': 'application/json' },
        });
        
        // Exécution
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
                
                // Si la connexion est OK
                } else if (data?.isLogged) {
                    isValidClientSession()
                        .then (data => {
                            
                            // Mise à jour du state de connexion
                            setClientSession({
                                isChecked: true,
                                isLogged: data?.isValid || false,
                                user: data?.user
                            });
                            dispatch(connexion({
                                isLogged: data?.isValid || false,
                                espace: "client"
                            }));
                    
                            // Fermeture de la fenêtre modale
                            setModalLogin({
                                ... modalLogin,
                                opened: false,
        
                                email: "",
                                pwd: ""
                            });
                        });
                }
            })
            .catch(err => {
                dispatch(showToast({
                    type: "danger",
                    message: "Une erreur est survenue, veuillez réessayer ultérieurement."
                }));
                return;
            });
    }


    const submitAddEvent = (e) => {
        e.preventDefault();

        if (isSubmitting) {
            return;
        }

        const addEventReqParams = {
            method: 'POST',
            body: JSON.stringify(formdata),
            headers: { 'content-type': 'application/json' },
        };

        if (clientSession?.isLogged) {
            isValidClientSession()
                .then (data => {
                    // En cas de déconnexion
                    if (!data?.isValid) {
                        setClientSession({
                            isChecked: true,
                            isLogged: false
                        });

                        dispatch(showToast({
                            type: "secondary",
                            message: <>
                                        <p>Délai de connexion expiré</p>
                                        <p>Veuillez vour reconnecter pour continuer.</p>
                                    </>
                        }));

                    // Option avec connexion au compte client
                    } else {
                        addEventReqParams.body = JSON.stringify({
                            ...formdata,
                            withSession: true
                        });
                        fetchAddEvent(addEventReqParams);
                    }
                });
        } else {
            // Option sans connexion
            fetchAddEvent(addEventReqParams);
        }
    }

    // Validation d'ajout de RDV
    const fetchAddEvent = (rqtParams) => {
        // State = On envoie le form
        setIsSubmitting(true);

        // Ecécution de l'appel à API: ajout Date / Horaire / entreprise liées à des données utilisateur
        const reqAddEvent = new Request('/event/add', rqtParams);
        fetch(reqAddEvent)
            .then(res => res.json())
            .then(resAddEvent => {

                // Erreur durant l'ajout = NOTIF
                if (resAddEvent?.hasError) {
                    dispatch(showToast({
                        type: "danger",
                        message: resAddEvent?.errorMsg
                    }));
                    return;
                }

                // Validation de données
                dispatch(showToast({
                    type: "primary",
                    message: "Rendez-vous pris en compte."
                }));

                // Redirection pour confirmer l'ajout en BDD
                navigate(`/my-events/sent`);
            }).catch(err => {

                // Erreur générale
                dispatch(showToast({
                    type: "danger",
                    message: "Erreur lors de l'ajout de votre rendez-vous."
                }));
            }).finally(() => {
                
                // State = On a fini de traiter l'info en backend
                setIsSubmitting(false);
            });
    };

    return (
        <section className="row">
            <article className="column">
                <h1 className="text-center no-margin">Prendre rendez-vous</h1>
                {
                    isLoading ?
                        // Chargement de la page
                        <div className="text-center">
                            <span className="spin material-icons load-icon">cached</span>
                        </div>
                    :    
                        // Formulaire de l'ajout de RDV         
                        <form method="post" className="container" onSubmit={submitAddEvent}>
                            <div className="row white-box flex-align-bl">
                                <div className="column">
                                    <h2 className="no-margin">Général</h2>

                                    {/* Liste des entreprises */}
                                    <div className="margin">
                                        <label htmlFor="company">Entreprise <b className="text-primary">*</b></label>            
                                        <Select
                                                isClearable
                                                isDisabled={isLoadingCompanies}
                                                isLoading={isLoadingCompanies}
                                                placeholder='-'
                                                noOptionsMessage={() => 'Aucun résultat'}
                                                onChange={(input) => {
                                                        setFormdata({
                                                            ...formdata,
                                                            company: input,
                                                            week: "",
                                                            hours: ""
                                                        });
                                                    }}
                                                options={companiesList}
                                                ariaLabelledBy="company"
                                                name="company"
                                                className="margin react-select-container"
                                                classNamePrefix="react-select"
                                                value={formdata.company}
                                            />
                                    </div>
                                    {
                                        formdata?.company?.value && (
                                            <div className="margin fade-in">
                                                <div className="row">

                                                    {/* Liste des semaines */}
                                                    <div className="column margin-top">
                                                        <label htmlFor="week">Semaine <b className="text-primary">*</b></label>            
                                                        <Select
                                                                isClearable
                                                                isDisabled={isLoadingWeek}
                                                                isLoading={isLoadingWeek}
                                                                placeholder='-'
                                                                noOptionsMessage={() => 'Aucun résultat'}
                                                                onChange={(input) => {
                                                                        setFormdata({
                                                                            ...formdata,
                                                                            week: input,
                                                                            hours: ""
                                                                        });
                                                                    }}
                                                                options={weekList}
                                                                ariaLabelledBy="week"
                                                                name="week"
                                                                className="margin react-select-container"
                                                                classNamePrefix="react-select"
                                                                value={formdata.week}
                                                            />
                                                    </div>
                                                    
                                                    {/* Liste des horaires */}
                                                    <div className="column margin-top">
                                                        <label htmlFor="hours">Horaire sélectionné <b className="text-primary">*</b></label>            
                                                        <Select
                                                                isClearable
                                                                isDisabled={isLoadingHours}
                                                                isLoading={isLoadingHours}
                                                                placeholder='-'
                                                                noOptionsMessage={() => 'Aucun résultat'}
                                                                onChange={(input) => {
                                                                        setFormdata({
                                                                            ...formdata,
                                                                            hours: input
                                                                        });
                                                                    }}
                                                                options={hoursList}
                                                                ariaLabelledBy="hours"
                                                                name="hours"
                                                                className="margin react-select-container"
                                                                classNamePrefix="react-select"
                                                                value={formdata.hours}
                                                            />
                                                    </div>
                                                </div>
                                            </div>
                                        ) 
                                    }
                                </div>
                            </div>
                            <div className="white-box">
                                <div className="margin">
                                    {
                                        !clientSession.isChecked ?
                                            // Vérification de la session en cours
                                            <div className="text-center">
                                                <span className="spin material-icons load-icon">cached</span>
                                            </div>
                                        :
                                            // Si non connecté: 2 CHOIX POSSIBLES
                                            !clientSession?.isLogged ?
                                                <div className="row flex-align-bl">

                                                    {/*
                                                      * Se connecter = bouton ver la fenêtre modale pour se connecter
                                                      * sans réinitialiser les infos: ENTREPRISE / DATE & HORAIRES
                                                      */}
                                                    <div className="column">
                                                        <h2 className="no-margin">
                                                            <div>Connexion client</div>
                                                            <div>&nbsp;</div>
                                                        </h2>
                                                        <div className="text-center margin">
                                                            <button className="btn btn-secondary"
                                                                    onClick={(e) => {
                                                                                e.preventDefault();
                                                                                setModalLogin({
                                                                                    ... modalLogin,
                                                                                    opened: true,

                                                                                    email: "",
                                                                                    pwd: ""
                                                                                });
                                                                            }}>
                                                                Se connecter
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <b>OU</b>
                                                    </div>

                                                    {/* Formulaire d'infos utilisateur sans connexion */}
                                                    <div className="column">
                                                        <h2 className="no-margin">
                                                            <div>Continuer</div>
                                                            <div>sans compte</div>
                                                        </h2>
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
                                                            <input type="text" id="email" name="email" value={formdata.email} onChange={changeFormdataElt} />
                                                        </div>
                                                        <div className="margin">
                                                            <label htmlFor="phone">Numéro de téléphone <b className="text-primary">*</b></label>
                                                            <input type="text" id="phone" name="phone" value={formdata.phone} onChange={changeFormdataElt} />
                                                        </div>
                                                    </div>
                                                </div>
                                            :
                                                // Si connecté
                                                <>
                                                    {/* Check de l'espace client */}
                                                    <AuthCheck roleRequired="client" espace="client" />

                                                    {/* Si OK, on résume les infos du profil client qui serton utilisées pour la commande */}
                                                    <div className="text-center">
                                                        <div className="column text-center">
                                                            Les informations suivantes présentes sur votre compte, seront renseignées afin de valider de valider votre rendez-vous :
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="column">
                                                            <div className="container">
                                                                <div className="row">
                                                                    <div className="column">
                                                                        <table className="no-border">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td><b>Prénom:</b></td>
                                                                                    <td>{clientSession?.user?.name}</td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td><b>Nom:</b></td>
                                                                                    <td>{clientSession?.user?.surname}</td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td><b>Adresse mail:</b></td>
                                                                                    <td>{clientSession?.user?.email}</td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td><b>Numéro de téléphone:</b></td>
                                                                                    <td>{clientSession?.user?.phone}</td>
                                                                                    
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                    <b className="column text-center text-secondary">
                                                                        Assurez vous que les informations rentrées sur votre compte soient correctes.
                                                                    </b>
                                                                </div>
                                                            </div>
                                                            <div className="column text-center"></div>
                                                        </div>
                                                    </div>
                                                </>
                                    }
                                </div>
                            </div>
                            <div className="text-right">
                                <button className="btn btn-primary" disabled={!isSubmitting && !clientSession.isChecked}>
                                    VALIDER MON RENDEZ-VOUS
                                </button>
                            </div>
                        </form>
                }
            </article>
            
            {/* Fenêtre modale pour se connecter sans rafraichir la page */}
            {modalLogin.opened === true ?
                <div className="modal">
                    <div className="modal-content container">
                        <div className="row">
                            <div className="column text-right">
                                <button className="btn btn-danger btn-action no-margin"
                                        onClick={(e) => {
                                                    e.preventDefault();
                                                    setModalLogin({ ... modalLogin, opened: false });
                                                }}>
                                    
                                    <span className="material-icons">
                                        close
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div className="row">
                            <div className="column">
                                <h1 className="text-center no-margin">Connexion client</h1>
                            </div>
                        </div>
                        <form method="post" className="white-box" onSubmit={submitLogin}>
                            <div className="margin">
                                <label htmlFor="emailLogin">Email</label>
                                <input id="emailLogin" name="email" type="email" className="inputUser" value={modalLogin.email} onChange={changeModalLoginForm} />
                            </div>
                            <div className="margin">
                                <label htmlFor="pwdLogin">Mot de passe</label>
                                <input id="pwdLogin" name="pwd" type="password" className="inputUser" value={modalLogin.pwd} onChange={changeModalLoginForm} />
                            </div>
                            
                            <div className="margin text-center">
                                <button className="btn btn-primary" type="submit">
                                    VALIDER
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                : ''
            }
            {/****************************/}
        </section>
    );
}

export default AddEvent;
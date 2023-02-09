import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import Select from "react-select";
import { statusList, statusListStr } from "../../../../misc/include";
import { hideToast, showToast } from "../../../../redux/actions/toast-action-types";

function ListEvents() {

    // States de chargement de page
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
    const [isLoadingList, setIsLoadingList] = useState(true);

    // States listant les données
    const [companiesList, setCompaniesList] = useState([]);
    const [eventsList, setEventsList] = useState({
        count: 0,
        data: [],
        eventsData: []
    });

    // Nombre d'éléments par page
    const limit = 5;

    const initSearch = {
        company: null,
        beginDate: "",
        endDate: "",
        status: null,
        confirmed: {label: "Tous", value: ""},
        page: 1,
        sortMethod: { label: "Pris récemment", value: "dateDesc" }
    };

    // States des formulaires de recherche
    const [searchParams, setSearchParams] = useState(initSearch);
    const [searchParamsSubmit, setSearchParamsSubmit] = useState(initSearch);

    // States des fenêtre modales et de ses formulaires
    const [modal, setModal] = useState({
        opened: false,
        typeModal: ""
    });
    const [modalForm, setModalForm] = useState({});

    // Gestion des states dans Redux
    const dispatch = useDispatch();
    
    // Liste des entreprises
    const getCompanies = () => {
        
        // Requête d'API pour la liste des entreprises 
        const reqListCompany = new Request('/company/list', {
            method: 'POST',
            body: JSON.stringify({ page: 1, isList: true }),
            headers: { 'content-type': 'application/json' },
        });
        
        fetch(reqListCompany)
            .then(res => res.json())
            .then(resCompanies => {

                // Conversion des entreprises en options de select
                const companiesData = [];
                for (const aCompany of resCompanies?.data) {
                    companiesData.push({
                        label: `${aCompany.name}`,
                        value:  aCompany._id
                    });
                }

                setCompaniesList(companiesData);
                setIsLoadingCompanies(false);
            })
            .catch(err => {
                setIsLoadingCompanies(false);
                return;
            });
    }

    //////////////////////
    // On met à jour la liste des rendez-vous (et selon la recherche + la page)
    //////////////////////
    const getEventsFromCompanies = () => {
        setIsLoadingList(true);

        // Requête listant les évènements
        let reqGetEvents = new Request('/event/list', {
            method: 'POST',
            body: JSON.stringify(searchParamsSubmit),
            headers: { 'content-type': 'application/json' },
        });
        
        // Effectue la requête
        fetch(reqGetEvents)
            .then(res => res.json())
            .then(data => {
                setEventsList({
                    ...eventsList,
                    count: data?.count || 0,
                    data: data?.data
                });
            })
            .catch(err => {
                dispatch(showToast({
                    type: "danger",
                    message: "Erreur lors de la récupération des données"
                }));
                return;
            })
            .finally(() => {
                setIsLoadingList(false);
            });
    }

    //////////////////////
    // Changement de value dans le formulaire de recherche
    //////////////////////
    const changeSearchParams = (e) => {
        e.preventDefault();

        setSearchParams({
            ...searchParams,
            [e.target.name]: e.target.value
        });
    }

    //////////////////////
    // Validation de la recherche d'un élément de la liste
    // = On change juste le numéro de page dans le state
    //////////////////////
    const changePageSearch = (e) => {
        e.preventDefault();

        setSearchParams({
            ...searchParams,
            page: parseInt(e.target.value)
        });
        setSearchParamsSubmit({
            ...searchParamsSubmit,
            page: parseInt(e.target.value)
        });
    }

    // Réinitialisation des éléments de recherche
    const clickReinitSearch = (e) => {
        e.preventDefault();
        setSearchParams({
            ...initSearch,
            page: searchParams.page
        });
    }

    //////////////////////
    // Validation de la recherche d'un élément de la liste
    // = On réactualise les infos à rechercher au propre dans le state
    //////////////////////
    const submitSearchParams = (e) => {
        e.preventDefault();
        setSearchParams({
            ...searchParams,
            page: 1
        });
        setSearchParamsSubmit({
            ...searchParams,
            page: 1
        });
    }

    //////////////////////
    // Validation du formulaire => changement de statut pour un RDV
    //////////////////////
    const submitChangeStatus = (e) => {
        e.preventDefault();
        dispatch(hideToast());
        
        const reqSubmit = new Request('/event/update-status', {
            method: 'POST',
            body: JSON.stringify(modalForm),
            headers: { 'content-type': 'application/json' },
        });
        
        fetch(reqSubmit)
            .then(res => res.json())
            .then(data => {
                if (data?.hasError) {
                    dispatch(showToast({
                        type: "danger",
                        message: data?.errorMsg
                    }));
                    return;
                }

                setModal({
                    opened: false,
                    typeModal: ""
                });
                
                dispatch(showToast({
                    type: "secondary",
                    message: "Rendez-vous mis à jour."
                }));
                getEventsFromCompanies();
            });
    }

    //////////////////////
    // Validation du formulaire => confirmation de RDV
    //////////////////////
    const submitConfirmEvent = (e) => {
        e.preventDefault();
        dispatch(hideToast());
        
        const reqSubmit = new Request('/event/confirm-event', {
            method: 'POST',
            body: JSON.stringify(modalForm),
            headers: { 'content-type': 'application/json' },
        });
        
        fetch(reqSubmit)
            .then(res => res.json())
            .then(data => {

                // Cas d'erreur
                if (data?.hasError) {
                    dispatch(showToast({
                        type: "danger",
                        message: data?.errorMsg
                    }));
                    return;
                }

                // On affiche le toast, et on réactualise la liste
                setModal({
                    opened: false,
                    typeModal: ""
                });
                dispatch(showToast({
                    type: "secondary",
                    message: "Rendez-vous mis à jour."
                }));
                getEventsFromCompanies();
            });
    }

    //////////////////////
    // Validation du formulaire => annulation de RDV
    //////////////////////
    const submitCancelEvent = (e) => {
        e.preventDefault();
        dispatch(hideToast());

        const reqSubmit = new Request('/event/cancel-event', {
            method: 'POST',
            body: JSON.stringify(modalForm),
            headers: { 'content-type': 'application/json' },
        });
        
        fetch(reqSubmit)
            .then(res => res.json())
            .then(data => {

                // Cas d'erreur
                if (data?.hasError) {
                    dispatch(showToast({
                        type: "danger",
                        message: data?.errorMsg
                    }));
                    return;
                }

                // On affiche le toast, et on réactualise la liste
                setModal({
                    opened: false,
                    typeModal: ""
                });
                dispatch(showToast({
                    type: "secondary",
                    message: "Rendez-vous mis à jour."
                }));
                getEventsFromCompanies();
            });
    }

    // Au chargement de la page, on récupère la liste des données 
    useEffect(() => {
        getCompanies();
    }, []);

    // Chargement de la fenêtre modale un fois le nom de la fenêtre renseignée  
    useEffect(() => {

        // Si un paramètre de fenêtre manque: erreur
        if (!modalForm?.id || !modal?.typeModal) {
            return;
        }

        let content;
        switch (modal.typeModal) {

            // Formulaire de changement de statut pour un RDV
            case 'updateStatus':
                content = (
                    <form onSubmit={submitChangeStatus} method="post">
                        <div className="row">
                            <div className="column margin">
                                <label htmlFor="statusModal">Statut :</label>
                                <Select
                                    isClearable
                                    placeholder='Tous'
                                    noOptionsMessage={() => 'Aucun résultat'}
                                    onChange={(input) => {
                                            console.log(input);
                                            setModalForm({
                                                ...modalForm,
                                                status: input
                                            });
                                        }}
                                    options={statusList}
                                    ariaLabelledBy="statusModal"
                                    name="status"
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    value={modalForm.status}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="column text-right">
                                <input type="submit" className="btn btn-primary btn-action" value="VALIDER" />
                                <button className="btn btn-danger btn-action"
                                        onClick={(e) => {
                                                    e.preventDefault();
                                                    setModal({
                                                        opened: false,
                                                        typeModal: ""
                                                    });
                                                }}>
                                    ANNULER
                                </button>
                            </div>
                        </div>
                    </form>
                );
                break;
            
            // Formulaire de confirmation de RDV
            case 'confirmEvent':
                content = (
                    <form onSubmit={submitConfirmEvent} method="post">
                        <div className="row">
                            <div className="column margin">
                                <p>Confirmer ?</p>
                            </div>
                        </div>
                        <div className="row">
                            <div className="column text-right">
                                <input type="submit" className="btn btn-primary btn-action" value="VALIDER" />
                                <button className="btn btn-danger btn-action"
                                        onClick={(e) => {
                                                    e.preventDefault();
                                                    setModal({
                                                        opened: false,
                                                        typeModal: ""
                                                    });
                                                }}>
                                    ANNULER
                                </button>
                            </div>
                        </div>
                    </form>
                );
                break;

            // Formulaire d'annulation de RDV
            case 'cancelEvent':
                content = (
                    <form onSubmit={submitCancelEvent} method="post">
                        <div className="row">
                            <div className="column margin">
                                <p>Annuler ?</p>
                            </div>
                        </div>
                        <div className="row">
                            <div className="column text-right">
                                <input type="submit" className="btn btn-primary btn-action" value="VALIDER" />
                                <button className="btn btn-danger btn-action"
                                        onClick={(e) => {
                                                    e.preventDefault();
                                                    setModal({
                                                        opened: false,
                                                        typeModal: ""
                                                    });
                                                }}>
                                    ANNULER
                                </button>
                            </div>
                        </div>
                    </form>
                );
                break;
            default:
                break;
        }

        // Si du content est associé à un nom de fenêtre, on l'affiche 
        if (content) {
            setModal({
                ...modal,
                content: content
            });
        
        // Sinon, on ferme la fenêtre
        } else {
            setModal({
                opened: false,
                typeModal: ""
            });
        }
    }, [modal.typeModal, modalForm]);

    // Lance un listage des rendez-vous lors d'une mise à jour définitive des critères de recherche
    useEffect(() => {
        getEventsFromCompanies();
    }, [searchParamsSubmit]);
        
    // Fait un traitement pour afficher correctement les données de rendez-vous
    useEffect(() => {
        const eventsTab = [];
        eventsList.data.forEach((anEvent, i) => {

            const startDate = new Date(anEvent.startDate);
            const startDateStr = `${startDate.toLocaleDateString('fr-FR')}`;
            const endDate = new Date(anEvent.endDate);  

            const hoursStr = `${anEvent.startDate.substring(11, 16).replace(':', 'h')} - ${anEvent.endDate.substring(11, 16).replace(':', 'h')}`;
            const diffHours = Math.round(
                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
            );

            const userFullname = (
                    anEvent?.user ?
                        <>
                            <div>{anEvent?.user?.name + " " + anEvent?.user?.surname?.toUpperCase()}</div>
                            <div>
                                <a href={"tel:"+anEvent?.user?.phone}>{anEvent?.user?.phone}</a>
                            </div>
                        </>
                    :
                        <>
                            <div>{anEvent?.userInfos?.name + " " + anEvent?.userInfos?.surname.toUpperCase()}</div>
                            <div>
                                <a href={"tel:"+anEvent?.userInfos?.phone}>{anEvent?.userInfos?.phone}</a>
                                </div>
                        </>
                );
        
            // Affichage du statut: non confirmé ou sinon on affiche le statut
            let eventStatusStr = "";
            let eventStatus = "";
            if (!anEvent?.confirmed) {
                eventStatusStr = <b className="text-danger">En attente de confirmation</b>;
            } else {
                switch(anEvent.status) {
                    case 'tbp':
                        eventStatus = "tbp";
                        break;
                    case 'paid':
                        eventStatus = "p";
                        break;
                    case 'cancel':
                        eventStatus = "c";
                        break;
                    default:
                        break;
                }
                
                const eventIndex = statusListStr.filter(option => option.value === eventStatus);
                if (eventIndex.length > 0) {
                    eventStatusStr = eventIndex[0]?.label;

                    if (eventStatus === 'c') {
                        eventStatusStr = <b className="text-danger">{eventStatusStr}</b>
                    }
                }
            }
    
            // Infos de l'entreprise concernée par le RDV
            const companyInfos = (
                <>
                    <div>{anEvent?.company?.name}</div>
                    <div><a href={"tel:"+anEvent?.company?.phone}>{anEvent?.company?.phone}</a></div>
                    <div><a href={"mailto:"+anEvent?.company?.email}>{anEvent?.company?.email}</a></div>
                </>
            );

            // Insertion dans le tableau à afficher dans le tableau d'affichage
            eventsTab.push({
                id: anEvent._id,

                userInfos: userFullname,
                statusStr: eventStatusStr,
                status: eventStatus,
                companyInfos: companyInfos,
                confirmed: anEvent.confirmed,
                startDateStr: startDateStr,
                hoursStr: hoursStr,
                diffHours: diffHours
            });
        });

        // Mise à jour du state du tableau d'affichage
        setEventsList({
            ...eventsList,
            eventsData: eventsTab
        });
    }, [eventsList.data]);

    return (
        <section className="row">
            <article className="column">
                <h1 className="text-center no-margin">Liste des rendez-vous</h1>
                <div className="container">
                    {/*
                      * FORMULARIRE DE RECHERCHE
                      */}
                    <form className="white-box no-margin-w" onSubmit={submitSearchParams}>
                        <div className="row">
                            <div className="column margin">
                                <label htmlFor="beginDateSearch">RDV de :</label>
                                <input type="date" id="beginDateSearch" name="beginDate" value={searchParams.beginDate} onChange={changeSearchParams} />
                            </div>
                            <div className="column margin">
                                <label htmlFor="endDateSearch">à :</label>
                                <input type="date" id="endDateSearch" name="endDate" value={searchParams.endDate} onChange={changeSearchParams} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="column margin">
                                <label htmlFor="companySearch">Entreprise :</label>
                                <Select
                                    isClearable
                                    isDisabled={isLoadingCompanies}
                                    isLoading={isLoadingCompanies}
                                    placeholder='-'
                                    noOptionsMessage={() => 'Aucun résultat'}
                                    onChange={(input) => {
                                            setSearchParams({
                                                ...searchParams,
                                                company: input
                                            });
                                        }}
                                    options={companiesList}
                                    ariaLabelledBy="companySearch"
                                    name="company"
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    value={searchParams.company}
                                />
                            </div>
                            <div className="column margin">
                                <label htmlFor="statusSearch">Statut :</label>
                                <Select

                                    isClearable
                                    placeholder='-'
                                    noOptionsMessage={() => 'Aucun résultat'}
                                    onChange={(input) => {
                                            setSearchParams({
                                                ...searchParams,
                                                status: input
                                            });
                                        }}
                                    options={statusList}
                                    ariaLabelledBy="statusSearch"
                                    name="status"
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    value={searchParams?.status && (statusList.filter(option => option.value === searchParams.status?.value))}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="column margin">
                                <label htmlFor="confirmedSearch">Confirmé :</label>
                                <Select
                                    isClearable
                                    placeholder='Tous'
                                    noOptionsMessage={() => 'Aucun résultat'}
                                    onChange={(input) => {
                                            setSearchParams({
                                                ...searchParams,
                                                confirmed: input
                                            });
                                        }}
                                    options={[
                                        {label: "Tous", value: ""},
                                        {label: "Oui", value: "true"},
                                        {label: "Non", value: "false"}
                                    ]}
                                    ariaLabelledBy="confirmedSearch"
                                    name="confirmed"
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    value={searchParams.confirmed}
                                />
                            </div>
                            <div className="column margin">
                                <label htmlFor="sortMethodSearch">Tri par :</label>
                                <Select
                                    isClearable
                                    placeholder='-'
                                    noOptionsMessage={() => 'Aucun résultat'}
                                    onChange={(input) => {
                                            setSearchParams({
                                                ...searchParams,
                                                sortMethod: input
                                            });
                                        }}
                                    options={[
                                        { label: "Pris récemment", value: "dateDesc" },
                                        { label: "Pris il y a longtemps", value: "dateAsc" },
                                        
                                        { label: "Date de RDV (décroissant)", value: "rdvDesc" },
                                        { label: "Date de RDV (croissant)", value: "rdvAsc" },
                                    ]}
                                    ariaLabelledBy="sortMethodSearch"
                                    name="sortMethod"
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    value={searchParams.sortMethod}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="column text-right">
                                <button className="btn btn-primary">
                                    Chercher 
                                </button>
                                <button className="btn btn-danger" onClick={clickReinitSearch}>
                                    Rénitialiser 
                                </button>
                            </div>
                        </div>
                    </form>
                    {/***************************************/}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th className="no-mobile">Date</th>
                            <th className="no-mobile">Entreprise</th>
                            <th className="no-mobile">Utilisateur</th>
                            <th className="no-mobile">Statut</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            isLoadingList ?
                                <tr>
                                    <td colSpan={5} className="text-center">
                                        <div className="spin material-icons load-icon">cached</div>
                                    </td>
                                </tr>
                            :
                                /* Dans le cas où le tableau a été chargé et possède des RDV */
                                (eventsList?.eventsData && eventsList.eventsData.length > 0) ?
                                    (
                                        eventsList.eventsData.map((eventInfos, i) =>
                                            <tr key={i} className="resLine text-center">
                                                <td>
                                                    <div>{eventInfos.startDateStr}</div>
                                                    <div>{eventInfos.hoursStr} ({eventInfos.diffHours}h)</div>
                                                </td>
                                                <td>{eventInfos.companyInfos}</td>
                                                <td>{eventInfos.userInfos}</td>
                                                <td>{eventInfos.statusStr}</td>
                                                <td className="actions text-left">
                                                    {eventInfos?.confirmed ?
                                                        <button className="btn btn-secondary btn-action"
                                                                title="Modifier le rendez-vous"
                                                                onClick={(e) => {
                                                                            e.preventDefault();
                                                                            console.log(eventInfos);
                                                                            setModal({
                                                                                opened: true,
                                                                                typeModal: "updateStatus"
                                                                            });
                                                                            setModalForm({
                                                                                id: eventInfos.id,
                                                                                status: statusList.filter(option => option.value === eventInfos.status)
                                                                            });
                                                                        }}>
                                                            <span className="material-icons">
                                                                edit
                                                            </span>
                                                        </button>
                                                    :
                                                        <button className="btn btn-primary btn-action"
                                                                title="Confirmer le rendez-vous"
                                                                onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setModal({
                                                                                opened: true,
                                                                                typeModal: "confirmEvent"
                                                                            });
                                                                            setModalForm({
                                                                                id: eventInfos.id
                                                                            });
                                                                        }}>
                                                            <span className="material-icons">
                                                                check
                                                            </span>
                                                        </button>
                                                    }
                                                    {eventInfos?.status !== "c" && (
                                                        <button className="btn btn-danger btn-action"
                                                                title="Annuler le rendez-vous"
                                                                onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setModal({
                                                                                opened: true,
                                                                                typeModal: "cancelEvent"
                                                                            });
                                                                            setModalForm({
                                                                                id: eventInfos.id
                                                                            });
                                                                        }}>
                                                            <span className="material-icons">
                                                                close
                                                            </span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )
                                :
                                    /* Liste des RDV (eventsList) vide */
                                    <tr>
                                        <td colSpan={5} className="text-center">Aucun rendez-vous n'a été trouvé.</td>
                                    </tr>
                        }
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colSpan={5} className="text-right">
                                <div className="margin">
                                    {/******* Sélection des pages ********/}
                                    {(eventsList.count > 0) && (
                                        <>
                                            Page &nbsp;
                                            <select style={{width: "5em"}} onChange={changePageSearch} value={searchParams.page}>
                                                {Array.from({length: Math.ceil(eventsList.count/limit)}, (x, i) => i + 1).map((elt, iPage) =>
                                                    <option value={iPage+1} key={iPage}>{iPage+1}</option> 
                                                )}  
                                            </select> 
                                            &nbsp;sur {Math.ceil(eventsList.count/limit)}
                                        </>
                                    )}
                                    {/************************************/}
                                </div>
                            </th>
                        </tr>
                    </tfoot>
                </table>

                {/******* Fenêtre modale ********/}
                {modal.opened === true && modal?.typeModal && modal?.content && (
                    <div className="modal">
                        <div className="modal-content container">
                            <div className="row">
                                <div className="column text-right">
                                    <button className="btn btn-danger btn-action no-margin"
                                            onClick={(e) => {
                                                        e.preventDefault();
                                                        setModal({
                                                            opened: false,
                                                            typeModal: ""
                                                        });
                                                    }}>
                                        
                                        <span className="material-icons">
                                            close
                                        </span>
                                    </button>
                                </div>
                            </div>
                            {modal.content}
                        </div>
                    </div>
                )}
                {/******************************/}
            </article>
        </section>
    );
}

export default ListEvents;
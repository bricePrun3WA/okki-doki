import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import Select from "react-select";
import { statusList, statusListStr } from "../../../../misc/include";
import { showToast } from "../../../../redux/actions/toast-action-types";

function ProfileEvents(props) {

    // States de chargement de données
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);

    // Liste des données à récupérer pour lister les RDV du compte & chercher sur des critères précis
    const [companiesList, setCompaniesList] = useState([]);
    const [eventsList, setEventsList] = useState({
        count: 0,
        data: [],
        eventsData: []
    });
    const limit = 5;

    const initSearch = {
        expace: "client",

        company: null,
        beginDate: "",
        endDate: "",
        status: null,
        confirmed: {label: "Tout", value: ""},
        page: 1,
        sortMethod: { label: "Pris récemment", value: "dateDesc" },

        ... JSON.parse(localStorage.getItem('clientProfileEvents'))
    };

    // States du formulaire de recherche
    const [searchParams, setSearchParams] = useState(initSearch);
    const [searchParamsSubmit, setSearchParamsSubmit] = useState(initSearch);

    // Gestion des notifications
    const dispatch = useDispatch();
    
    // Récupération de la liste des entreprises
    const getCompanies = () => {

        // Simple = version plus allégé des données renvoyées
        fetch('/company/list/simple')
            .then(res => res.json())
            .then(resCompanies => {

                // Conversion en option pour un select
                const companiesData = [];
                for (const aCompany of resCompanies) {
                    companiesData.push({
                        label: `${aCompany.name}`,
                        value:  aCompany._id
                    });
                }

                // Mise à jour des states de données et de chargement pour les entreprises
                setCompaniesList(companiesData);
                setIsLoadingCompanies(false);
            })
            .catch(err => {
                setIsLoadingCompanies(false);
                return;
            });
    }

    // Gère la requête de récupération des RDV en BDD
    const getEvents = () => {
        setIsLoadingEvents(true);

        // Requête d'API listant les évènements
        let reqGetEvents = new Request('/event/session/get', {
            method: 'POST',
            body: JSON.stringify(searchParamsSubmit),
            headers: { 'content-type': 'application/json' },
        });
        
        // Effectue la requête
        fetch(reqGetEvents)
            .then(res => res.json())
            .then(result => {
                // Erreur (de paramètre, ou général mais non bloquant)
                if (result?.isValid === false || result?.hasError) {
                    dispatch(showToast({
                        type: "danger",
                        message: result?.errorMsg
                    }));
                    return;
                }
                
                // Mise à jour des states de données et de chargement des RDV
                setEventsList({
                    ...eventsList,
                    data: result.data,
                    count: result?.count || 1
                });
            })
            .catch(err => {
                // Erreur générale (bloquante)
                dispatch(showToast({
                    type: "danger",
                    message: "Erreur lors de la récupération des données"
                }));
                return;
            })
            .finally(() => {
                setIsLoadingEvents(false);
            });
    }

    // Au chargement de la page: on récupère les entreprises pour les rajouter dans le critère de recherche
    useEffect(() => {
        getCompanies();
    }, []);

    // Au chargement de la data des RDV: on récupère les entreprises pour les rajouter dans le critère de recherche
    useEffect(() => {
        const eventsTab = [];
        eventsList.data.forEach((anEvent, i) => {
            // Gestion des dates & horaires
            const startDate = new Date(anEvent.startDate);
            const startDateStr = `${startDate.toLocaleDateString('fr-FR')}`;
            const endDate = new Date(anEvent.endDate);
            const hoursStr = `${anEvent.startDate.substring(11, 16).replace(':', 'h')} - ${anEvent.endDate.substring(11, 16).replace(':', 'h')}`;
            const diffHours = Math.round(
                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
            );
    
            // Gestion des informations de contact d'une entrepise
            const companyInfos = (
                <>
                    <div>{anEvent?.company?.name}</div>
                    <div><a href={"tel:"+anEvent?.company?.phone}>{anEvent?.company?.phone}</a></div>
                    <div><a href={"mailto:"+anEvent?.company?.email}>{anEvent?.company?.email}</a></div>
                </>
            );

            // Gestion des informations de status
            let eventStatus = "";
            let eventStatusStr = "";
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

                // Récupération du libellé à afficher en fonction du statut de RDV
                const eventIndex = statusListStr.filter(option => option.value === eventStatus);
                if (eventIndex.length > 0) {
                    eventStatusStr = eventIndex[0]?.label;
                    if (eventStatus === 'c') {
                        eventStatusStr = <b className="text-danger">{eventStatusStr}</b>
                    }
                }
            }
    
            // Ajout des informations
            eventsTab.push({
                id: anEvent._id,
                
                eventStatusStr: eventStatusStr,

                companyInfos: companyInfos,
                startDateStr: startDateStr,
                hoursStr: hoursStr,
                diffHours: diffHours
            });
        });
        
        // Mise à jour du state avec les informations à afficher
        setEventsList({
            ...eventsList,
            eventsData: eventsTab
        });
    }, [eventsList.data]);

    // Dès lors où les données sont envoyées au formulaire de recherche (même lors de l'init):
    // => on appelle la récupéation des infos par fetch
    useEffect(() => {
        getEvents();
    }, [searchParamsSubmit]);

    // Récupération et stockage local des infos saisies pour la recherche
    useEffect(() => {
        localStorage.setItem('clientProfileEvents', JSON.stringify(searchParams));
    }, [searchParams]);

    // Réinitialisation des éléments de recherche
    const clickReinitSearch = (e) => {
        e.preventDefault();
        setSearchParams({
            ...initSearch,
            page: searchParams.page
        });
    }

    // Evènement de changement de value pour un input
    const changeSearchParams = (e) => {
        e.preventDefault();

        setSearchParams({
            ...searchParams,
            [e.target.name]: e.target.value
        });
    }

    // Action de changement de page
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

    // Action de validation du formulaire de recherche
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

    return (
        <section className="row">
            <article className="column">
                <h1 className="text-center no-margin">Mes rendez-vous</h1>
                <div className="container">
                    <form className="white-box no-margin-w" onSubmit={submitSearchParams}>
                        {/* Période: RDV du ... au ... */}
                        <div className="row">
                            <div className="column margin">
                                <label htmlFor="beginDate">RDV de :</label>
                                <input type="date" id="beginDate" name="beginDate" value={searchParams.beginDate} onChange={changeSearchParams} />
                            </div>
                            <div className="column margin">
                                <label htmlFor="endDate">à :</label>
                                <input type="date" id="endDate" name="endDate" value={searchParams.endDate} onChange={changeSearchParams} />
                            </div>
                        </div>
                        {/*************************/}

                        {/* Gestion du statut des RDV */}
                        <div className="row">
                            <div className="column margin">
                                <label htmlFor="confirmed">Confirmé :</label>
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
                                    ariaLabelledBy="confirmed"
                                    name="confirmed"
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    value={searchParams.confirmed}
                                />
                            </div>

                            <div className="column margin">
                                <label htmlFor="status">Statut :</label>
                                <Select
                                    isClearable
                                    placeholder='Tous'
                                    noOptionsMessage={() => 'Aucun résultat'}
                                    onChange={(input) => {
                                            setSearchParams({
                                                ...searchParams,
                                                status: input
                                            });
                                        }}
                                    options={statusList}
                                    ariaLabelledBy="status"
                                    name="status"
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    value={searchParams?.status && (statusList.filter(option => option.value === searchParams.status?.value))}
                                />
                            </div>
                        </div>
                        {/*************************/}

                        {/* Divers */}
                        <div className="row">
                            <div className="column margin">
                                <label htmlFor="company">Entreprise :</label>
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
                                    ariaLabelledBy="company"
                                    name="company"
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    value={searchParams.company}
                                />
                            </div>
                            <div className="column margin">
                                <label htmlFor="sortMethod">Tri par :</label>
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
                                    ariaLabelledBy="sortMethod"
                                    name="sortMethod"
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    value={searchParams.sortMethod}
                                />
                            </div>
                        </div>
                        {/*************************/}

                        {/* Bouton de validation */}
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
                </div>

                {/* tableaux listant les RDV (avec / sans critère(s)) */}
                <table>
                    <thead>
                        <tr>
                            <th className="no-mobile">Date</th>
                            <th className="no-mobile">Entreprise</th>
                            <th className="no-mobile">Statut</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            isLoadingEvents ?
                                // Chargement des RDV
                                <tr>
                                    <td colSpan={4} className="text-center">
                                        <span className="spin material-icons load-icon">cached</span>
                                    </td>
                                </tr>
                            :
                                (eventsList?.eventsData && eventsList.eventsData.length > 0) ?
                                    // Affichage des RDV
                                    eventsList.eventsData.map((eventInfos, i) =>
                                        <tr key={i}>
                                            <td>
                                                <div>{eventInfos.startDateStr}</div>
                                                <div>{eventInfos.hoursStr} ({eventInfos.diffHours}h)</div>
                                            </td>
                                            <td>{eventInfos.companyInfos}</td>
                                            <td>{eventInfos.eventStatusStr}</td>
                                            <td>&nbsp;</td>
                                        </tr>
                                    )
                                :
                                    // PAS de RDV
                                    <tr><td className="text-center" colSpan={4}>Aucun RDV ne correspond à votre recherche.</td></tr>
                        }
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colSpan={4} className="text-right">
                                {/* Sélection du numéro de page */}
                                <div className="margin">
                                    {eventsList.count > 0 && (
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
                                </div>
                            </th>
                        </tr>
                    </tfoot>
                </table>
            </article>
        </section>
    );
}

export default ProfileEvents;
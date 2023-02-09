
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { NavLink } from "react-router-dom";

import { hideToast, showToast } from "../../../redux/actions/toast-action-types";

function Home() {

    // Liste des RDV et statistiques
    const [eventsList, setEventsList] = useState({
        data: [],
        dataAffich: []
    });
    const [eventStats, setEventStats] = useState({});

    // State de chargement
    const [isLoading, setIsLoading] = useState(false);

    // Gestion des notifications
    const dispatch = useDispatch();

    // Liste des utilisateurs
    const getStats = () => {
        setIsLoading(true);

        dispatch(hideToast());

        // Requête API listant les évènements à confirmer
        let reqGetEvents = new Request('/event/list', {
            method: 'POST',
            body: JSON.stringify({ resume: true }),
            headers: { 'content-type': 'application/json' },
        });

        // Requête API des stats
        let reqStats = new Request('/home-stats', {
            method: 'POST',
            body: JSON.stringify({ resume: true }),
            headers: { 'content-type': 'application/json' },
        });
        
        // Effectue la requête
        fetch(reqGetEvents)
            .then(res => res.json())
            .then(async (dataEvents) => {
                if (dataEvents?.hasError) {
                    dispatch(showToast({
                        type: "danger",
                        message: dataEvents.errorMsg
                    }));
                    return;
                }

                setEventsList({
                    data: dataEvents?.data || []
                });
        
                // Effectue la requête
                fetch(reqStats)
                    .then(res => res.json())
                    .then(dataStats => {
                        if (dataStats?.hasError) {
                            dispatch(showToast({
                                type: "danger",
                                message: dataStats.errorMsg
                            }));
                            return;
                        }
                        
                        // Rapports stats mois actuel / mois précédent
                        const marginRdv = (((dataStats?.countRdv - dataStats?.countOMRdv) / dataStats?.countOMRdv)*100);
                        const marginUsers = (((dataStats?.nbUsers - dataStats?.nbOMUsers) / dataStats?.nbUsers)*100);
                        const marginNoAccUsers = (((dataStats?.nbNoAccUsers - dataStats?.nbNoAccOMUsers) / dataStats?.nbNoAccUsers)*100);
                        setEventStats({
                            ...dataStats,
                            marginRdv: marginRdv,
                            marginUsers: marginUsers,
                            marginNoAccUsers: marginNoAccUsers
                        });
                    });
            })
            .finally(()=> { 
                setIsLoading(false);
            });
    }

    // Au chargement de la page...
    useEffect(() => {
        if (isLoading) {
            return;
        }

        // On appelle la récupération des différentes informations à envoyer aux plusieurs tableaux de stats
        getStats();
    }, []);
    
    // Traitement des informations chargées dans la liste des RDV
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

            // Gestion de l'affichage des infos de contact utilisateur
            const userInfos = (
                anEvent?.user ?
                    <>
                        <div>
                            {anEvent?.user?.name + " " + anEvent?.user?.surname?.toUpperCase()}
                        </div>
                        <div>
                            <a href={"tel:"+anEvent?.user?.phone}>{anEvent?.user?.phone}</a>
                        </div>
                        <div>
                            <a href={"matilto:"+anEvent?.user?.email}>{anEvent?.user?.email}</a>
                        </div>
                    </>
                :
                    <>
                        <div>
                            {anEvent?.userInfos?.name + " " + anEvent?.userInfos?.surname.toUpperCase()}
                        </div>
                        <div>
                            <a href={"tel:"+anEvent?.userInfos?.phone}>{anEvent?.userInfos?.phone}</a>
                        </div>
                        <div>
                            <a href={"matilto:"+anEvent?.userInfos?.email}>{anEvent?.userInfos?.email}</a>
                        </div>
                    </>
            );

            // Gestion de l'affichage des infos de contact entreprise
            const companyInfos = (
                <>
                    <div>{anEvent?.company?.name}</div>
                    <div>
                        <a href={"tel:"+anEvent?.company?.phone}>{anEvent?.company?.phone}</a>
                    </div>
                    <div>
                        <a href={"matilto:"+anEvent?.company?.email}>{anEvent?.company?.email}</a>
                    </div>
                </>
            );

            // Gestion du statut à afficher
            let eventStatus = "";
            switch(anEvent.status) {
                case 'tbp':
                    eventStatus = "En attente de paiement";
                    break;
                case 'paid':
                    eventStatus = "Payé";
                    break;
                case 'cancel':
                    eventStatus = "Annulé";
                    break;
                default:
                    break;
            }

            // Mise à jour du tableaux tampon pour les rendez-vous
            eventsTab.push({
                id: anEvent._id,

                companyInfos: companyInfos,
                userInfos: userInfos,
                status: eventStatus,
                startDateStr: startDateStr,
                hoursStr: hoursStr,
                diffHours: diffHours
            });
        });

        // Mise à jour du state d'affichage
        setEventsList({
            ...eventsList,
            dataAffich: eventsTab || []
        });
    }, [eventsList.data]);

    return (
        <section className="row">
            <article className="column">
                <h1 className="text-center no-margin">Accueil</h1>
                <div className="row flex-align-top">
                    <div className="column white-box">
                        <h2 className="text-center no-margin">Derniers rendez-vous non confirmés</h2>
                        <table className="margin-top">
                            <thead>
                                <tr>
                                    <th className="no-mobile">Date</th>
                                    <th className="no-mobile">Entreprise</th>
                                    <th className="no-mobile">Utilisateur</th>
                                </tr>
                                <tr className="mobile-only">
                                    <th>&nbsp;</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    eventsList?.dataAffich && eventsList.dataAffich.length > 0 ?
                                        /* Liste des RDV en attente */
                                        (eventsList.dataAffich.map((eventInfos, i) =>
                                            <tr key={i}>
                                                <td>
                                                    <div>{eventInfos.startDateStr}</div>
                                                    <div>{eventInfos.hoursStr} ({eventInfos.diffHours}h)</div>
                                                </td>
                                                <td>{eventInfos.companyInfos}</td>
                                                <td>{eventInfos.userInfos}</td>
                                            </tr>
                                        ))
                                    :
                                        /* Liste VIDE des RDV en attente */
                                        <tr>
                                            <td colSpan={3} className="text-center">Aucun rendez-vous n'est en attente.</td>
                                        </tr>
                                }
                                <tr>
                                    <td colSpan={3} className="text-center">
                                        <NavLink className="btn btn-primary" to="/admin/events">
                                            Gérer les rendez-vous
                                        </NavLink>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th colSpan={3}>&nbsp;</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className="column flex-align-top">
                        {/* Statistiques du mois / comparaison avec le mois dernier */}
                        {eventStats && eventStats?.countRdv ?
                            <>
                                <div className="white-box padding text-center">
                                    <h2 className="no-margin">Commandes</h2>
                                    <div className="margin-top"><b>Rendez-vous le mois dernier :</b> {eventStats?.countOMRdv}</div>
                                    <div className="no-margin"><b>Rendez-vous ce mois :</b> {eventStats?.countRdv}</div>
                                    <div className={(eventStats.marginRdv < 0 ? "text-bold text-danger" : "")}>
                                        (soit {""+eventStats.marginRdv.toFixed(2).replaceAll('.',',')} % par rapport au mois dernier)
                                    </div>
                                </div>
                                <div className="white-box padding text-center">
                                    <h2 className="no-margin">Utilisateurs</h2>
                                    <div>
                                        <div className="margin-top"><b>Comptes créés le mois dernier :</b> {eventStats?.nbOMUsers}</div>
                                        <div><b>Comptes créés ce mois :</b> {eventStats?.nbUsers}</div>
                                        <div className={(eventStats.marginUsers < 0 ? "text-bold text-danger" : "")}>
                                            (soit {""+eventStats.marginUsers.toFixed(2).replaceAll('.',',')} % par rapport au mois dernier)
                                        </div>
                                    </div>
                                    <div>
                                        <div className="margin-top"><b>Comptes invités différents le mois dernier :</b> {eventStats?.nbNoAccOMUsers}</div>
                                        <div><b>Comptes invités différents ce mois :</b> {eventStats?.nbNoAccUsers}</div>
                                        <div className={(eventStats.marginNoAccUsers < 0 ? "text-bold text-danger" : "")}>
                                            (soit {""+eventStats.marginNoAccUsers.toFixed(2).replaceAll('.',',')} % par rapport au mois dernier)
                                        </div>
                                    </div>
                                </div>
                            </>
                        :
                            // Chargement des stats
                            <div className="text-center">
                                <span className="spin material-icons load-icon">cached</span>
                            </div>
                        }
                    </div>
                </div>
            </article>
        </section>
    );
}

export default Home;
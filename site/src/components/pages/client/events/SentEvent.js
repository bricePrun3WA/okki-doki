import { useEffect, useState } from "react";

function SentEvent(props) {
    const [eventInfos, setEventInfos] = useState(null);

    // Récupération du rendez-vous
    const getEvent = () => {       

        // Recherche en base de donnée, du dernier rendez-vous validé par formulaire de l'utilisateur
        fetch('/event/confirmed/get')
            .then(res => res.json())
            .then(result => {
                if (result?.isValid === false || result?.hasError) {
                    return;
                }

                // Gestion des dates et horaires à afficher
                const startDate = new Date(result.startDate);
                const startDateStr = `${startDate.toLocaleDateString('fr-FR')}`;
                const endDate = new Date(result.endDate);
                const hoursStr = `${result.startDate.substring(11, 16).replace(':', 'h')} - ${result.endDate.substring(11, 16).replace(':', 'h')}`;
                const diffHours = Math.round(
                    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
                );
                
                // Affichage des informations de contact de l'entreprise contactée
                const companyInfos = (
                    <>
                        <div>{result?.company?.name}</div>
                        <div><a href={"tel:"+result?.company?.phone}>{result?.company?.phone}</a></div>
                        <div><a href={"mailto:"+result?.company?.email}>{result?.company?.email}</a></div>
                    </>
                );
        
                // Mise à jour du state d'affichage
                setEventInfos({
                    id: result._id,
                    companyInfos: companyInfos,
                    startDateStr: startDateStr,
                    hoursStr: hoursStr,
                    diffHours: diffHours
                });
            });
    }

    // Au chargemment de la page, on appelle la fonction de récupération d'infos de RDV
    useEffect(() => {
        getEvent();
    }, []);

    return (
        <>
            {
                eventInfos !== null ?
                    // Cas où le rendez-vous a bien été récupéré
                    <section className="row">
                        <article className="column">
                            <h1 className="text-center no-margin">Rendez-vous demandé</h1>
                            <table>
                                <thead>
                                    <tr>
                                        <th className="no-mobile">Date</th>
                                        <th className="no-mobile">Entreprise</th>
                                        <th className="no-mobile">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div>{eventInfos.startDateStr}</div>
                                            <div>{eventInfos.hoursStr} ({eventInfos.diffHours}h)</div>
                                        </td>
                                        <td>{eventInfos.companyInfos}</td>
                                        <td className="text-center">
                                            <b className="text-danger">En attente de confirmation</b>
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th className="no-mobile">&nbsp;</th>
                                        <th className="no-mobile">&nbsp;</th>
                                        <th className="no-mobile">&nbsp;</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </article>
                    </section>
                :
                    // Cas où le RDV est toujours en attente de chargement
                    <div className="text-center">
                        <span className="spin material-icons load-icon">cached</span>
                    </div>
            }
        </>    
    );
}

export default SentEvent;
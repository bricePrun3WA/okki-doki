import { NavLink } from "react-router-dom";

// Contenu pour notifier un problème de droits pour l'accès à la page
const NoAuth = () => {
    return (
        <section className="row">
            <article className="column">
                <div className="white-box text-center padding">
                    <p>Nous n'avez pas les droits nécessaires pour accéder à cette page.</p>
                    <NavLink to="/admin" className="btn btn-primary">Retour à l'accueil</NavLink>
                </div>
            </article>
        </section>
    );
}

export default NoAuth;
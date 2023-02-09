//  Page "Accueil" de l'espace CLIENT
function ClientHome() {
    return (
        <section className="row">
            <article className="column">
                <h1 className="text-center no-margin">Bienvenue sur OKKI DOKI</h1>

                <section className="white-box margin">
                    <h2>OKKI DOKI: c'est quoi ?</h2>
                    <p>
                        Besoin de prendre rendez-vous, réserver une place dans un restaurant, un rendez-vous professionnel ?
                        OKKI DOKI est <u>LA</u> solution qu'il vous faut !
                    </p>
                    <p>
                        Par le biais de notre site, les entreprises proposent de <b className="highlight">configurer leur espace personnel</b>, pour ainsi vous permettre de disposer de leurs horaires de disponibilité.
                        Il vous suffira de vous rendre dans <b>l'onglet "PRENDRE RENDEZ-VOUS"</b>, de rentrer la date et l'heure qui vous convient, ainsi que quelques informations pour vous contacter... Et c'est fait, <b className="highlight">votre rendez-vous est demandé !</b>
                    </p>
                    <p>
                        Si vous souhaiter vous renseigner davantage sur le fonctionnement du site, une foire aux questions se trouve sur la page <b>"À PROPOS"</b>, accessible via l'onglet en en-tête du site.
                    </p>
                </section>
            </article>
        </section>
    );
}

export default ClientHome;
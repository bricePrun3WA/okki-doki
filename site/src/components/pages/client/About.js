// Page "à propos"
function About(props) {
    return (
        <section className="row">
            <article className="column">
                <h1 className="text-center no-margin">À propos de l'application</h1>

                <div className="white-box margin">
                    <section>
                        <h2>OKKI DOKI: c'est quoi ?</h2>
                        <p>
                            Besoin de prendre rendez-vous, réserver une place dans un restaurant, un rendez-vous professionnel ?
                            OKKI DOKI est <u>LA</u> solution qu'il vous faut !
                        </p>
                        <p>
                            Par le biais de notre site, les entreprises proposent de <b className="highlight">configurer leur espace</b>, pour ainsi vous permettre de disposer de leurs horaires de disponibilité.
                            Il vous suffira de rentrer la date et l'heure qui vous convient, ainsi que quelques informations pour confirmer... Et c'est fait, <b className="highlight">votre rendez-vous est pris !</b>
                        </p>
                    </section>
                    <section>
                        <h2>Je suis professionnel, qu'est-ce que cela changerait ?</h2>
                        <p>
                            En fonction des différents secteurs métiers, il est parfois difficile de s'occuper de vos clients si d'autres tâches sont imposées,
                            comme la gestion des fournisseurs, les rendez-vous en internes ou avec des clients...
                        </p>
                        <p>
                            Notre application a donc été réalisée dans le but de vous <b className="highlight">alléger cette charge de travail</b>,
                            tout en vous assurant diverses options annexes, tel que la disponibilité de contacter directement le client, de gérer des options personnalisées sur les rendez-vous... 
                        </p>
                    </section>
                </div>
            </article>
        </section>
    );
}

export default About;
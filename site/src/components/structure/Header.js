import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { deconnexion } from "../../redux/actions/session-action-types";
import { showToast } from "../../redux/actions/toast-action-types";

import NavBar from "./NavBar";

// Contenu d'en-tête de page
const Header = (props) => {
  // State où le menu sur mobile est ouvert
  const [mobileMenuOpened, setMobileMenuOpened] = useState(false);

  // Récupération du prop spécifiant l'espace utilisé actuellement
  const espace = props.isAdmin ? "admin" : "client";
  
  // On récupère l'état de la session via Redux
  const { myReducerSession } = useSelector(state => {
    return {
        myReducerSession : state.reducerSession
    }
  });

  // Gestionnaire des states via Redux
  const dispatch = useDispatch();

  // Action de déconnexion
  const handleDeconnexionBtn = (e) => {
    e.preventDefault();

    // Requête API pour mettre à jour la session
    const reqLogout = new Request(`/logout`, {
        method: 'POST',
        body: JSON.stringify({
          espace: espace
        }),
        headers: { 'content-type': 'application/json' },
    });

    // Exécution de la requête
    fetch(reqLogout)
        .then(res => res.json())
        .then(dataLogout => {

          // Si déconnecté, on met à jour le state Redux de connexion
          if (!dataLogout?.hasError) {
            dispatch(deconnexion({ done: "ok", espace: espace }));
            dispatch(showToast({
                type: 'primary',
                message: 'Vous êtes désormais déconnecté.'
            }));
          } else {
            dispatch(showToast({
              type: 'danger',
              message: dataLogout?.errorMsg
            }));
          }
        })
        .catch(err => {
          dispatch(showToast({
              type: 'danger',
              message: 'Erreur lors de la déconnexion.'
          }));
        });
  }

  return (
    <header className="header container">
      <div className="row padding">
        {/******* LOGO de l'application WEB ********/}
        <div className="column container">
          <NavLink to="/" className="row text-no-underline">
            <div>
              <img id="header-logo" className="column" src="/img/logo-white.webp" alt="Logo de l'application OKKI DOKI" />
            </div>
            <div className="column text-light">
              {
                espace === "admin" && (
                  <>ADMIN</>
                )
              }
            </div>
          </NavLink>
        </div>
        {/***************/}
        <div className="column text-right">
          {
            espace === "admin" ?
              // Si on est sur l'espace "admin", on affiche...
              (
                !myReducerSession?.isLogged?.admin ?
                  // ... un lien pour se connecter si ce n'est pas fait
                  <NavLink to="login" className="btn btn-primary">
                    <span className="material-icons">
                      login
                    </span>
                  </NavLink>
                :
                  // ... Les actions sur les informations personnelles d'un admin: profil et déconnexion 
                  <div className="dropdown">
                    <button className="btn btn-primary">
                      <span className="material-icons">
                        account_circle
                      </span>
                    </button>
                    <div className="dropdown-menu">
                      <NavLink to="/admin/profil" className="btn btn-primary btn-action">
                        Profil
                      </NavLink>
                      <button onClick={handleDeconnexionBtn} className="btn btn-danger btn-action">
                        Se déconnecter
                      </button>
                    </div>
                  </div>
              )
            :
              // Si on est sur l'espace "client", on affiche...
              (
                !myReducerSession?.isLogged?.client ?
                  // ... un lien pour se connecter si ce n'est pas fait
                  <NavLink to="login" className="btn btn-primary">
                    <span className="material-icons">
                      login
                    </span>
                  </NavLink>
                :
                  // ... Les actions sur les informations personnelles d'un client:
                  // profil, l'historique des ancient RDV et la déconnexion 
                  <div className="dropdown">
                    <button className="btn btn-primary">
                      <span className="material-icons">
                        account_circle
                      </span>
                    </button>
                    <div className="dropdown-menu">
                      <NavLink to="/profil" className="btn btn-secondary btn-action">
                        Profil
                      </NavLink>
                      <NavLink to="/my-events/list" className="btn btn-secondary btn-action">
                        Mes rendez-vous
                      </NavLink>
                      <button onClick={handleDeconnexionBtn} className="btn btn-danger btn-action">
                        Se déconnecter
                      </button>
                    </div>
                  </div>
              )
          }

          {/* Icon "burger" pour afficher le menu sous mobile */}
          <button className="btn btn-primary btn-mob-menu" onClick={(e) => { setMobileMenuOpened(true); }}>
            <span className="material-icons">
              menu
            </span>
          </button>
        </div>
      </div>
      <div className="row">
        <div className="column">
          {
            /* Liste des onglets ADMIN */
            (espace === "admin" && myReducerSession?.isLogged?.admin) && (
              <NavBar mobileMenuOpened={mobileMenuOpened} setMobileMenuOpened={setMobileMenuOpened} isAdmin={true} />
            )
          }
          {
            /* Liste des onglets CLIENT */
            espace === "client" && (
              <NavBar mobileMenuOpened={mobileMenuOpened} setMobileMenuOpened={setMobileMenuOpened} />
            )
          }
        </div>
      </div>
    </header>
  );
}

export default Header;
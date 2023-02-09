import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';

function NavBar(props) {

  // On récupère l'état de la session via Redux
  const { myReducerSession } = useSelector(state => {
    return {
        myReducerSession : state.reducerSession
    }
  });

  // States des liens présents en menu
  const [menuLinks, setMenuLinks] = useState([]);
  const [menuLinksContent, setMenuLinksContent] = useState("");

  // Récupération de la liste des onglets accessibles
  useEffect(() => {
    if (myReducerSession.isLogged) {
      const reqMenuLinks = new Request(`/menu-links`, {
        method: 'POST',
        body: JSON.stringify({
            session: myReducerSession.session
        }),
        headers: { 'content-type': 'application/json' },
      });

      fetch(reqMenuLinks)
        .then(res => res.json())
        .then(data => {
          const newLinks = data?.links || [];
          setMenuLinks(newLinks);
        });
    }
  }, []);

  useEffect(() => {
    setMenuLinksContent(!props?.isAdmin ?
      // Affiche la liste des onglets en espace ADMIN
      <>
        <NavLink to="/" className={listClasses} onClick={(e) => { props.setMobileMenuOpened(false); }}>
          ACCUEIL
        </NavLink>
        <NavLink to="/event/add" className={listClasses} onClick={(e) => { props.setMobileMenuOpened(false); }}>
          PRENDRE RENDEZ-VOUS
        </NavLink>
        <NavLink to="/about" className={listClasses} onClick={(e) => { props.setMobileMenuOpened(false); }}>
          A PROPOS
        </NavLink>
      </>
    :
      // Affiche la liste des onglets en espace CLIENT
      <>
        <NavLink to="/admin/" className={listClasses} onClick={(e) => { props.setMobileMenuOpened(false); }}>
          ACCUEIL
        </NavLink>
        { menuLinks.includes("companies") && (
          <NavLink to="/admin/companies" className={listClasses} onClick={(e) => { props.setMobileMenuOpened(false); }}>
            ENTREPRISES
          </NavLink>
        )}
        { menuLinks.includes("events") && (
          <NavLink to="/admin/events" className={listClasses} onClick={(e) => { props.setMobileMenuOpened(false); }}>
            RENDEZ-VOUS
          </NavLink>
        )}
        { menuLinks.includes("users") && (
          <NavLink to="/admin/users" className={listClasses} onClick={(e) => { props.setMobileMenuOpened(false); }}>
            UTILISATEURS
          </NavLink>
        )}
      </>
    );
  }, [menuLinks]);


  // Fonction de check si l'onglet est actif ou non
  const listClasses = ({ isActive }) => {
    const listClasses = ["btn", "menu-link"];
    
    if (isActive) {
      listClasses.push("active")
    }

    return listClasses.join(' ');
  };

  // Onglet actif ?
  const isMenuOpened = "container " + (
    props.mobileMenuOpened ?
      "active"
    :
      ""
  );
  

  // Contenu de la liste des onglets en en-tête de page
  return (
    <nav id="menu" className={ isMenuOpened }>
      <div className="row">
        <div className="column">
          <div className="text-right">
            <button className="btn btn-link text-light btn-mob-menu" onClick={(e) => { e.preventDefault(); props.setMobileMenuOpened(false); }}>
              <span className="material-icons">
                close
              </span>
            </button>
          </div>
          {menuLinksContent}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
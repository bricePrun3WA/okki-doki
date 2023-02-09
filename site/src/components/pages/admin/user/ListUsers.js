import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { NavLink } from 'react-router-dom';

import Select from "react-select";
import { showToast } from "../../../../redux/actions/toast-action-types";

function ListUsers(props) {
    
    // States de chargement de page
    const [isLoadingList, setIsLoadingList] = useState(true);

    // States listant les données
    const [usersList, setUsersList] = useState({
        count: 0,
        data: [],
        eventsData: []
    });

    // Nombre d'éléments par page
    const limit = 5;

    // Valeur par défaut de la recherche
    const initSearch = {
        name: "",
        surname: "",
        email: "",
        phone: "",
        page: 1,
        sortMethod: { label: "Pris récemment", value: "dateDesc" }
    };

    // Champs renseignés pour ajouter un user
    const [searchParams, setSearchParams] = useState(initSearch);
    const [searchParamsSubmit, setSearchParamsSubmit] = useState(initSearch);

    // State de la fenêtre de supppression d'utilisateur
    const [modalDel, setModalDel] = useState({
        opened: false,
        id: "",
        name: ""
    });

    // Gestionnaire des states Redux
    const dispatch = useDispatch();

    // Liste des utilisateurs
    const getUsers = () => {
        setIsLoadingList(true);

        // Requête API pour lister les utilisateurs
        const reqList = new Request('/user/list', {
            method: 'POST',
            body: JSON.stringify(searchParamsSubmit),
            headers: { 'content-type': 'application/json' },
        });

        // Exécution de la requête
        fetch(reqList)
            .then(res => res.json())
            .then(data => {
                if (data?.hasError) {
                    dispatch(showToast({
                        type: "danger",
                        message: data?.errorMsg
                    }));
                    return;
                }

                // Mise à jour du tableau
                setUsersList({
                    count: data?.count || 0,
                    data: data?.data || []
                });
            })
            .catch(err => {

                // Si erreur, on l'affiche via toast
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

    // A l'affichage de la page, on liste par défaut les utilisateurs
    useEffect(() => {
        getUsers();
    }, []);

    // Lorsqu'on modifie les critères à rechercher en cliquant sur "chercher", on liste par défaut les utilisateurs
    useEffect(() => {
        getUsers();
    }, [searchParamsSubmit]);

    // Evènement de changement de value pour un input
    const changeSearchParams = (e) => {
        e.preventDefault();

        setSearchParams({
            ...searchParams,
            [e.target.name]: e.target.value
        });
    }

    // Modification du numéro de page sélectionné 
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

    // Action de modification des critères à chercher pour les utilsateurs
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

    // Action de validation de suppression utilisateur
    const submitDeleteUser = (e) => {
        e.preventDefault();

        // Requête d'API pour la suppression d'un utilisateur
        let reqDelUser = new Request('/user/delete', {
            method: 'POST',
            body: JSON.stringify(modalDel),
            headers: { 'content-type': 'application/json' },
        });
        
        // Effectue la requête
        fetch(reqDelUser)
            .then(res => res.json())
            .then(data => {
                // En cas de validation de suppression: on raffraîchit la page
                if (data.isValid === false) {
                    return;
                }

                // Si la validation s'est bien passé => Toast de confirmation
                if (data === 'OK') {
                    setModalDel({
                        opened: false,
                        id: "",
                        name: ""
                    });
                    getUsers();
                }
                return;
            });
    }

    return (
        <section className="row">
            <article className="column">
                <h1 className="text-center no-margin">Liste des utilisateurs</h1>
                <div className="container">
                    <form className="white-box no-margin-w" onSubmit={submitSearchParams}>
                        <div className="row">
                            <div className="column margin">
                                <label htmlFor="name">Prénom :</label>
                                <input type="text" name="name" value={searchParams.name} onChange={changeSearchParams} />
                            </div>
                            <div className="column margin">
                                <label htmlFor="surname">Nom :</label>
                                <input type="text" name="surname" value={searchParams.surname} onChange={changeSearchParams} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="column margin">
                                <label htmlFor="email">Adresse mail :</label>
                                <input type="email" name="email" value={searchParams.email} onChange={changeSearchParams} />
                            </div>
                            <div className="column margin">
                                <label htmlFor="phone">Téléphone :</label>
                                <input type="text" name="phone" value={searchParams.phone} onChange={changeSearchParams} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="column margin">
                                <label htmlFor="phone">Tri par :</label>
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
                </div>
                <table>
                    <thead>
                        <tr>
                            <th className="no-mobile">Nom</th>
                            <th className="no-mobile">Prénom</th>
                            <th className="no-mobile">Mail</th>
                            <th className="no-mobile">Téléphone</th>
                            <th className="no-mobile">Rôles</th>
                            <th className="text-right">
                                <NavLink to="/admin/user/add" className="btn btn-primary btn-action" title="Ajouter un utilisateur">
                                    <span className="material-icons">
                                        add
                                    </span> 
                                </NavLink>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            isLoadingList ?
                                /* Chargement de la liste */
                                <tr>
                                    <td colSpan={5} className="text-center">
                                        <div className="spin material-icons load-icon">cached</div>
                                    </td>
                                </tr>
                            :
                                /* Dans le cas où le tableau a été chargé et possède des utilisateurs */
                                usersList?.data && usersList.data.length > 0 ?
                                    usersList.data.map((aUser, i) =>
                                        <tr key={i}>
                                            <td>{aUser.surname.toUpperCase()}</td>
                                            <td>{aUser.name}</td>
                                            <td>{aUser.email}</td>
                                            <td>{aUser.phone}</td>
                                            <td className="text-center">
                                                <div className="mobile-only text-bold">Rôles:</div>
                                                {aUser.roles.map((role,iRole) => <div key={iRole}>{role}</div>)}
                                            </td>
                                            <td className="text-right">
                                                <NavLink to={"/admin/user/update/" + aUser._id} className="btn btn-secondary btn-action">
                                                    <span className="material-icons">
                                                        edit
                                                    </span>
                                                </NavLink>
                                                {(aUser?.roles && aUser.roles.indexOf("superadmin") === -1) && (
                                                    <button className="btn btn-danger btn-action"
                                                        onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setModalDel({
                                                                        opened: true,
                                                                        id: aUser._id,
                                                                        name: `${aUser.name} ${aUser.surname}`
                                                                    });
                                                                }}>

                                                        <span className="material-icons">
                                                        delete
                                                        </span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                :
                                    /* Liste des utilisateurs (usersList) vide */
                                    <tr>
                                        <td colSpan={6} className="text-center">Aucun utilisateur disponible.</td>
                                    </tr>
                        }
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colSpan={6} className="text-right">
                                <div className="margin">
                                    {/* Pagination de la liste des utilisateurs */}
                                    {(usersList.count > 0) && (
                                        <>
                                            Page &nbsp;
                                            <select style={{width: "5em"}} onChange={changePageSearch} value={searchParams.page}>
                                                {Array.from({length: Math.ceil(usersList.count/limit)}, (x, i) => i + 1).map((elt, iPage) =>
                                                    <option value={iPage+1} key={iPage}>{iPage+1}</option> 
                                                )}  
                                            </select> 
                                            &nbsp;sur {Math.ceil(usersList.count/limit)}
                                        </>
                                    )}
                                </div>
                            </th>
                        </tr>
                    </tfoot>
                </table>

                {/******* Fenêtre modale - Validation de suppression d'utilisateur ********/}
                {modalDel.opened === true && (
                    <div className="modal">
                        <div className="modal-content container">
                            <div className="row">
                                <div className="column text-right">
                                    <button className="btn btn-danger btn-action no-margin"
                                            onClick={(e) => {
                                                        e.preventDefault();
                                                        setModalDel({
                                                            opened: false,
                                                            id: "",
                                                            name: ""
                                                        });
                                                    }}>
                                        
                                        <span className="material-icons">
                                            close
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <form
                                onSubmit={submitDeleteUser} method="post">        
                        
                                <input type="hidden" name="id" value={modalDel.id} />

                                <div className="row">
                                    <div className="column">
                                        <p>
                                            Voulez-vous supprimer l'utilisateur "{modalDel.name}" ?
                                        </p>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="column text-right">
                                        <input type="submit" className="btn btn-primary btn-action" value="VALIDER" />
                                        <button className="btn btn-danger btn-action"
                                                onClick={(e) => {
                                                            e.preventDefault();
                                                            setModalDel({
                                                                opened: false,
                                                                id: "",
                                                                name: ""
                                                            });
                                                        }}>
                                            ANNULER
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/******************************/}
            </article>
        </section>
    );
}

export default ListUsers;
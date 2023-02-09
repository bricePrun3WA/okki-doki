import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { NavLink } from 'react-router-dom';

import Select from "react-select";
import { showToast } from "../../../../redux/actions/toast-action-types";

function ListCompanies(props) {

    // States de chargement de page
    const [isLoadingList, setIsLoadingList] = useState(true);

    // States listant les données
    const [companiesList, setCompaniesList] = useState({
        count: 0,
        data: []
    });

    // State vérifiant si l'on est "super admin"
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    // Nombre d'éléments par page
    const limit = 5;

    const initSearch = {
        nameLike: "",
        phone: "",
        page: 1,
        sortMethod: { label: "Ordre alphabétique", value: "nameAsc" }
    };

    // States des formulaires de recherche
    const [searchParams, setSearchParams] = useState(initSearch);
    const [searchParamsSubmit, setSearchParamsSubmit] = useState(initSearch);

    // States de fenêtre modale pour valider la suppression d'une entreprise
    const [modalDel, setModalDel] = useState({
        opened: false,
        id: "",
        name: ""
    });

    // Gestion des states dans Redux
    const dispatch = useDispatch();

    // Liste des entreprises
    const getCompanies = () => {
        setIsLoadingList(true);

        // Requête d'API pour lister les entreprises existantes 
        const reqListCompany = new Request('/company/list', {
            method: 'POST',
            body: JSON.stringify(searchParamsSubmit),
            headers: { 'content-type': 'application/json' },
        });
        
        fetch(reqListCompany)
            .then(res => res.json())
            .then(resCompanies => {
                setCompaniesList({
                    count: resCompanies.count,
                    data: resCompanies.data || []
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

    // Vérification super admin (pour ajouter le lien "Ajouter une entreprise" par exemple)
    const checkSessionSA = () => {

        // Requête d'API de vérification de session
        const reqCheckSession = new Request('/check-session', {
            method: 'POST',
            body: JSON.stringify({espace: "superadmin"}),
            headers: { 'content-type': 'application/json' },
        });
        
        fetch(reqCheckSession)
            .then(res => res.json())
            .then(data => {
                if (data?.isValid === true) {
                    setIsSuperAdmin(true);
                }
            })
            .catch(err => {
                return;
            });
    }

    useEffect(() => {
        checkSessionSA();
    }, []);


    // Lance un listage des entreprises lors d'une mise à jour définitive des critères de recherche
    useEffect(() => {
        getCompanies();
    }, [searchParamsSubmit]);

    // Evènement de changement de value pour un input
    const changeSearchParams = (e) => {
        e.preventDefault();

        setSearchParams({
            ...searchParams,
            [e.target.name]: e.target.value
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

    // Validation de la recherche via critères
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

    // Changement de page de la liste courante
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

    // Fonction exécutée après validation de la suppression d'une entreprise
    const submitDeleteCompany = (e) => {
        e.preventDefault();

        // Requête d'API pour la suppression d'une entreprise 
        let reqDelCompany = new Request('/company/delete', {
            method: 'POST',
            body: JSON.stringify(modalDel),
            headers: { 'content-type': 'application/json' },
        });
        
        // Effectue la requête
        fetch(reqDelCompany)
            .then(res => res.json())
            .then(data => {
                // En cas de validation de suppression: on raffraîchit la page
                if (data === 'OK') {
                    setModalDel({
                        opened: false,
                        id: "",
                        name: ""
                    });
                    getCompanies();
                }
                return;
            });
    }

    return (
        <section className="row">
            <article className="column">
                <h1 className="text-center no-margin">Liste des entreprises</h1>
                <div className="container">
                    {/*
                      * FORMULARIRE DE RECHERCHE
                      */}
                    <form className="row white-box no-margin-w" onSubmit={submitSearchParams}>
                        <div className="column margin">
                            <label htmlFor="nameLike">Nom d'entreprise :</label>
                            <input type="text" name="nameLike" value={searchParams.nameLike} onChange={changeSearchParams} />
                        </div>
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
                                    { label: "Ordre alphabétique", value: "nameAsc" },
                                    { label: "Les + récents", value: "dateDesc" },
                                    { label: "Les + anciens", value: "dateAsc" }
                                ]}
                                name="sortMethod"
                                className="react-select-container"
                                classNamePrefix="react-select"
                                value={searchParams.sortMethod}
                            />
                        </div>
                        <div className="column text-right">
                            <button className="btn btn-primary">
                                Chercher 
                            </button>
                            <button className="btn btn-danger" onClick={clickReinitSearch}>
                                Rénitialiser 
                            </button>
                        </div>
                    </form>
                    {/***************************************/}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th className="no-mobile">Nom</th>
                            <th className="no-mobile">
                                <div>Utilisateur</div>
                                <div>princ.</div>
                            </th>
                            <th className="text-right">
                                {isSuperAdmin && (
                                    <NavLink to="/admin/company/add" className="btn btn-primary btn-action" title="Ajouter une entreprise">
                                        <span className="material-icons">
                                            add
                                        </span> 
                                    </NavLink>
                                )}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            isLoadingList ?
                                /* Chargement de la liste */
                                <tr>
                                    <td colSpan={4} className="text-center">
                                        <div className="spin material-icons load-icon">cached</div>
                                    </td>
                                </tr>
                            :
                                /* Dans le cas où le tableau a été chargé et possède des entreprises */
                                (companiesList?.data && companiesList?.data.length > 0 ?
                                    companiesList.data.map((aCompany, i) =>
                                        <tr key={i}>
                                            <td>{aCompany.name}</td>
                                            <td>
                                                <b className="mobile-only">Compte. princ.: &emsp;</b>
                                                {
                                                    aCompany?.mainUser?
                                                        (aCompany?.mainUser.name + " " + aCompany?.mainUser.surname)
                                                    :
                                                        '/'
                                                }
                                            </td>
                                            <td className="text-right">
                                                {
                                                    aCompany?.isEditable && (
                                                        <>
                                                            <NavLink
                                                                    to={"/admin/company/update/general/" + aCompany._id}
                                                                    className="btn btn-secondary mary btn-action"
                                                                    title="Modifier les informations">
                                                                <span className="material-icons">
                                                                    edit
                                                                </span>
                                                            </NavLink>
                                                            <NavLink
                                                                    to={"/admin/company/update/hours/" + aCompany._id}
                                                                    className="btn btn-secondary btn-action"
                                                                    title="Gérer les RDV / horaires">
                                                                <span className="material-icons">
                                                                    schedule
                                                                </span>
                                                            </NavLink>
                                                            {isSuperAdmin && (
                                                                <button
                                                                        className="btn btn-danger btn-action"
                                                                        title="Supprimer l'entreprise"
                                                                        onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    setModalDel({
                                                                                        opened: true,
                                                                                        id: aCompany._id,
                                                                                        name: `${aCompany.name}`
                                                                                    });
                                                                                }}>
                                                                    <span className="material-icons">
                                                                        delete
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </>
                                                    )
                                                }
                                            </td>
                                        </tr>
                                    )
                                :
                                    /* Liste des entreprises (companiesList) vide */
                                    <tr>
                                        <td colSpan={3} className="text-center">Aucune entreprise n'est disponible.</td>
                                    </tr>
                                )
                        }
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colSpan={3} className="text-right">
                                <div className="margin">
                                    {/* Pagination de la liste des entreprises */}
                                    {(companiesList.count > 0) && (
                                        <>
                                            Page &nbsp;
                                            <select style={{width: "5em"}} onChange={changePageSearch} value={searchParams.page}>
                                                {Array.from({length: Math.ceil(companiesList.count/limit)}, (x, i) => i + 1).map((elt, iPage) =>
                                                    <option value={iPage+1} key={iPage}>{iPage+1}</option> 
                                                )}  
                                            </select> 
                                            &nbsp;sur {Math.ceil(companiesList.count/limit)}
                                        </>
                                    )}
                                </div>
                            </th>
                        </tr>
                    </tfoot>
                </table>

                {/******* Fenêtre modale - Validation de suppression d'entreprise ********/}
                {isSuperAdmin && modalDel.opened === true && (
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

                            <form onSubmit={submitDeleteCompany} method="post">

                                <div className="row">
                                    <div className="column">
                                        <p>
                                            Voulez-vous supprimer l'entreprise "{modalDel.name}" ?
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

export default ListCompanies;
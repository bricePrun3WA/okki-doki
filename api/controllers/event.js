import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import validator from "validator";

import Company from "../models/company.js";
import Event from "../models/event.js";
import User from "../models/user.js";

import { sendMail } from "./mail.js";
import { getSessionInfos, isSessionValid } from "../utils/utilities.js";
import { UNKNOWN_ID_ERROR, MISSING_PARAM_ERROR, GET_DATA_ERROR, UPDATE_DATA_ERROR, FORMAT_DATA_ERROR } from "../utils/variables.js";

//////////////////////////////
// Récupère les évènements liés à un utilisateur
//////////////////////////////
function getEventsFromSession (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: GET_DATA_ERROR
    }
    
    // On décode la session et ses infos 
    jwt.verify (req?.session?.client?.session, process.env.SESSION_SECRET, (err, decoded) => {
        if (err) {
            return res.json({ count: 0, data: [] });
        } else {
            const user = decoded?.user;
    
            // Paramètres d'affichage
            const page = req?.body?.page && !Number.isNaN(req?.body?.page) ? req?.body?.page : 1;
            const limit = 5;
            let sortBy = {};
            switch (req?.body?.sortMethod?.value) {
                case 'dateAsc':
                    sortBy = { "dateUpdated": 1 };
                    break;
                case 'rdvDesc':
                    sortBy = { "startDate": -1 };
                    break;
                case 'rdvAsc':
                    sortBy = { "startDate": 1 };
                    break;
                default:
                    sortBy = { "dateUpdated": -1 };
                    break;
            }
        
            const matchParams = { };

            // Récupération de l'ID de l'utilisateur de session
            matchParams.user = mongoose.Types.ObjectId(user.id);

            // RDV après le...
            if (req?.body?.beginDate) {
                if (!validator.isDate(req.body.beginDate)) {
                    myRet.hasError = true;
                    myRet.errorMsg = FORMAT_DATA_ERROR;
                    return res.json(myRet);
                }
                const dateBegin = new Date(`${req?.body?.beginDate}T00:00:00.000Z`);
                matchParams.startDate = {$gte : dateBegin};
            }

            // RDV avant le...
            if (req?.body?.endDate) {
                if (!validator.isDate(req.body.endDate)) {
                    myRet.hasError = true;
                    myRet.errorMsg = FORMAT_DATA_ERROR;
                    return res.json(myRet);
                }
                const dateEnd = new Date(`${req?.body?.endDate}T23:59:59.000Z`);
                matchParams.endDate = {$lte : dateEnd};
            }

            // RDV confirmé ou non ?
            if (req?.body?.confirmed?.value) {
                matchParams.confirmed = req.body.confirmed.value === 'true';
            }

            // Statut de RDV
            if (req?.body?.status?.value) {
                if (!validator.isAlpha(req.body.status.value)) {
                    myRet.hasError = true;
                    myRet.errorMsg = FORMAT_DATA_ERROR;
                    return res.json(myRet);
                }
                switch (req.body.status.value) {
                    case 'p':
                        matchParams.status = "paid";
                        break;
                    case 'tbp':
                        matchParams.status = "tbp";
                        break;
                    case 'c':
                        matchParams.status = "cancel";
                        break;
                    default:
                        break;
                }
            }

            // Entreprise ciblée
            if (req?.body?.company?.value) {
                matchParams.company = mongoose.Types.ObjectId(req.body.company.value);
            }

            // On cherche en BDD le nombre de RDV
            Event
                .find(matchParams)
                .count((err, resCount) => {
                    if (err || resCount === 0) {
                        if (err) {
                            myRet.hasError = true;
                        }
                        return res.json({
                            ...myRet,
                            count: 0,
                            data: []
                        });
                    }
                    
                    const limit = 5;
                    const count = Math.max(resCount, 1);
                    const skipParam = (Math.min(page, Math.ceil(count / limit))-1) * limit;
        
                    // On cherche en BDD les RDV avec les critères cherchés
                    Event
                        .find(matchParams)
                        .populate("company")
                        .select('_id company status confirmed startDate endDate dateUpdated')
                        .sort(sortBy)
                        .skip(skipParam)
                        .limit(limit)
                        .then(users => {
                            return res.json({
                                count: resCount || 0,
                                data: users
                            });
                        })
                        .catch(err => {
                            myRet.hasError = true;
                            return res.json({
                                ...myRet,
                                count: 0,
                                data: []
                            });
                        });
                });
        }
    });
}

//////////////////////////////
// Récupère le RDV demandé par un CLIENT
//////////////////////////////
function getConfirmedEvent (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

    // Récupération du RDV par son id, récupéré depuis la session actuelle d'Express Session
    Event
        .findById(req?.session?.confirmedEvent)
        .populate("company")
        .sort({dateUpdated : -1})
        .then(event => {
            if (event === null) {
                myRet.hasError = true;
                myRet.errorMsg = GET_DATA_ERROR;
                return res.json(myRet);
            }

            // Si l'objet est trouvé, on l'envoie
            return res.json(event);
        }).catch(err => {
            myRet.hasError = true;
            myRet.errorMsg = GET_DATA_ERROR;
            return res.json(myRet);
        });
}

//////////////////////////////
// Récupère les évènements liés aux entreprises d'un ADMIN
//////////////////////////////
function getEventsFromCompany (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

    const companiesList = [];
    
    // Paramètre de listage: PAGE / CRITERES / NOMBRE DE DOCUMENTS PAR PAGE
    const page = req?.body?.page && !Number.isNaN(req?.body?.page) ? req?.body?.page : 1;
    const limit = 5;
    const matchParams = {};
    let sortBy = { $sort: {} };

    // Si page résumé, tous les éléments non confirmé les plus urgents à traiter
    if (req?.body?.resume) {
        matchParams.confirmed = false;
        sortBy = { "startDate": 1 };
    
    // Sinon, on est sur la liste des rendez-vous = on cherche les RDV selon les critères de recherche
    } else {

        // Mode de tri
        switch (req?.body?.sortMethod?.value) {
            case 'dateAsc':
                sortBy = { "dateUpdated": 1 };
                break;
            case 'rdvDesc':
                sortBy = { "startDate": -1 };
                break;
            case 'rdvAsc':
                sortBy = { "startDate": 1 };
                break;
            default:
                sortBy = { "dateUpdated": -1 };
                break;
        }

        // RDV dès la date...
        if (req?.body?.beginDate) {
            if (!validator.isDate(req.body.beginDate)) {
                myRet.hasError = true;
                myRet.errorMsg = FORMAT_DATA_ERROR;
                return res.json(myRet);
            }
            const dateBegin = new Date(`${req?.body?.beginDate}T00:00:00.000Z`);
            matchParams.startDate = {$gte : dateBegin};
        }

        // RDV avant la date...
        if (req?.body?.endDate) {
            if (!validator.isDate(req.body.endDate)) {
                myRet.hasError = true;
                myRet.errorMsg = FORMAT_DATA_ERROR;
                return res.json(myRet);
            }
            const dateEnd = new Date(`${req?.body?.endDate}T23:59:59.000Z`);
            matchParams.endDate = {$lte : dateEnd};
        }

        // Statut actuel du RDV
        if (req?.body?.status?.value) {
            if (!validator.isAlpha(req.body.status.value)) {
                myRet.hasError = true;
                myRet.errorMsg = FORMAT_DATA_ERROR;
                return res.json(myRet);
            }
            
            switch (req.body.status.value) {
                case 'p':
                    matchParams.status = "paid";
                    break;
                case 'tbp':
                    matchParams.status = "tbp";
                    break;
                case 'c':
                    matchParams.status = "cancel";
                    break;
                default:
                    break;
            }
        }
        
        // RDV confirmé par l'entreprise (ou pas)
        if (req?.body?.confirmed?.value) {
            matchParams.confirmed = req.body.confirmed.value === 'true';
        }

        // Recheche d'entreprises associées
        if (req?.body?.company?.value) {
            matchParams.company = mongoose.Types.ObjectId(req.body.company.value);
        }
    }

    let returnedValue;

    // On décode la session et ses infos 
    jwt.verify (req?.session?.admin?.session, process.env.SESSION_SECRET, async (err, decoded) => {
        if (err) {
            myRet.hasError = true;
            myRet.errorMsg = GET_DATA_ERROR;
            myRet.data = [];
            return res.json(myRet);
        } else {
            const user = decoded?.user;

            try {
                // Si SUPER ADMIN: tu affiches tous les évents
                const resValidSuperAdmin = await isSessionValid(req?.session?.admin, "superadmin");
                if (!resValidSuperAdmin?.isValid) {

                    // Liste des sociétés en lien avec l'utilisateur
                    await Company
                        .find({ $or: [{ mainUser: user?.id }, { users: user?.id }] })
                        .then(companies => {

                            // Cas où aucune société n'est lié à l'utilisateur = pas d'évènement
                            if (companies.length === 0) {
                                returnedValue = {
                                    count: 0,
                                    data: []
                                };
                                return;
                            }

                            // Récupération des ID d'entreprises liés au compte admin connecté
                            for (const company of companies) {
                                companiesList.push(company._id);
                            }
                        });
                        
                    if (returnedValue) {
                        return res.json(returnedValue);
                    }

                    if (!req?.body?.company?.value && companiesList.length > 0) {
                        matchParams.company = { $in: companiesList };
                    }
                }

                // Requête BDD sur le nombre de RDV liés
                Event
                    .find(matchParams)
                    .count((err, resCount) => {
                        if (err || resCount === 0) {
                            if (err) {
                                myRet.hasError = true;
                                myRet.errorMsg = GET_DATA_ERROR;
                            }
                            return res.json({
                                ...myRet,
                                count: 0,
                                data: []
                            });
                        }
                        
                        // Apramètres de pagination
                        const limit = 5;
                        const count = Math.max(resCount, 1);
                        const skipParam = (Math.min(page, Math.ceil(count / limit))-1) * limit;
            
                        // Requête BDD sur les RDV 
                        Event
                            .find(matchParams)
                            .populate({
                                path: 'company',
                                select: 'name email phone'
                            })
                            .populate({
                                path: 'user',
                                select: '_id name surname'
                            })
                            .select('_id company user userInfos status confirmed startDate endDate dateUpdated')
                            .sort(sortBy)
                            .skip(skipParam)
                            .limit(limit)
                            .then(users => {
                                return res.json({
                                    count: resCount || 0,
                                    data: users
                                });
                            })
                            .catch(err => {
                                myRet.hasError = true;
                                myRet.errorMsg = GET_DATA_ERROR;
                                return res.json({
                                    ...myRet,
                                    count: 0,
                                    data: []
                                });
                            });
                    });
            } catch (err) {
                myRet.hasError = true;
                myRet.errorMsg = GET_DATA_ERROR;
                return res.json(myRet);
            }
        }
    });
}

//////////////////////////////
// Confirme un rendez-vous dont on a l'accès en ADMIN
//////////////////////////////
function confirmEvent (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    };

    // ID de RDV manquant
    if (!req?.body?.id) {
        myRet.hasError = true;
        myRet.errorMsg = UNKNOWN_ID_ERROR;
        return res.json(myRet);
    } else if (!validator.isAlphanumeric(req.body.id)) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    const companiesList = [];
    
    // On décode la session et ses infos 
    jwt.verify (req?.session?.admin?.session, process.env.SESSION_SECRET, (err, decoded) => {
        if (err) {
            myRet.hasError = true;
            myRet.errorMsg = UPDATE_DATA_ERROR;
            return res.json(myRet);
        } else {
            const user = decoded?.user;

            // Liste des sociétés en lien avec l'utilisateur
            // (Permet de ne pas modifier une information dont on n'a pas l'accès)
            Company
                .find({ $or: [{ mainUser: user?.id }, { users: user?.id }] })
                .then(companies => {
                    for (const company of companies) {
                        companiesList.push(company._id);
                    }

                    // Accès refusé
                    if (companies.length === 0) {
                        myRet.hasError = true;
                        myRet.errorMsg = UNKNOWN_ID_ERROR;
                        return res.json(myRet);
                    }
                    
                    // On recherche le rendez-vous non confirmé avec son id incluant l'une de ces entreprises
                    Event
                        .findOneAndUpdate(
                            {
                                company: { $in: companiesList },
                                _id: mongoose.Types.ObjectId(req.body.id)
                            },
                            {
                                confirmed: true
                            }
                        ).then(async (event) => {

                            // Récupération de l'adresse mail où envoyer l'information de confirmation
                            const emailToSend = (
                                event?.user ?
                                    await User.findById(event.user)?.email
                                :
                                    event?.userInfos?.email || ""
                            );

                            // Informations du RDV pour l'affichage dans le mail de confirmation
                            const companyFound = await Company.findById(event.company);
                            const startHourDate = new Date(event.startDate);
                            const endHourDate = new Date(event.endDate);

                            // Paramètres pour le mail de confirmation de RDV à destination du CLIENT
                            const mailClientParams = {
                                to: emailToSend,
                                subject: "OKKI DOKI - Rendez-vous validé",
                                text: ""
                            };
                            const htmlClientContent = `
                                    <p>Bonjour,</p>
        
                                    <p>
                                        Votre rendez-vous ci-dessous, a été confirmé par l'entreprise concernée:
                                    </p>
                                    <div>
                                        <table style="
                                                margin: auto;
                                                text-align: center;
                                                border-collapse: collapse;">
                                            <tbody>
                                                <tr>
                                                    <td style="%leftTable% %topLeftTable%">
                                                        Entreprise
                                                    </td>
                                                    <td style="%rightTable% %topRightTable%">
                                                        ${companyFound.name}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="%leftTable% %bottomLeftTable%">
                                                        Date
                                                    </td>
                                                    <td style="%rightTable% %bottomRightTable%">
                                                        <div>${startHourDate.toLocaleDateString('fr-FR')}</div>
                                                        <div>De ${startHourDate.toISOString().substring(11, 16).replace(':', 'h')} à ${endHourDate.toISOString().substring(11, 16).replace(':', 'h')}</div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <p>
                                        Cordialement,<br/>
                                        <b>L'Équipe OKKI DOKI</b>
                                    </p>
                                `;

                            // Envoi du mail au CLIENT
                            sendMail(mailClientParams, htmlClientContent).finally(() => {
                                return res.json("ok");
                            });
                        }).catch(err => {
                            myRet.hasError = true;
                            myRet.errorMsg = UPDATE_DATA_ERROR;
                            return res.json(myRet);
                        });
                });
        }
    });
}

////////////////////////
// Annule un rendez-vous dont on a l'accès en ADMIN
////////////////////////
function cancelEvent (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    };

    if (!req?.body?.id) {
        myRet.hasError = true;
        myRet.errorMsg = UNKNOWN_ID_ERROR;
        return res.json(myRet);
    } else if (!validator.isAlphanumeric(req.body.id)) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    const companiesList = [];
    
    // On décode la session et ses infos 
    jwt.verify (req?.session?.admin?.session, process.env.SESSION_SECRET, (err, decoded) => {
        if (err) {
            myRet.hasError = true;
            myRet.errorMsg = UPDATE_DATA_ERROR;
            return res.json(myRet);
        } else {
            const user = decoded?.user;

            // Liste des sociétés en lien avec l'utilisateur
            // (Permet de ne pas modifier une information dont on n'a pas l'accès)
            Company
                .find({ $or: [{ mainUser: user?.id }, { users: user?.id }] })
                .then(companies => {
                    for (const company of companies) {
                        companiesList.push(company._id);
                    }

                    // Accès refusé
                    if (companies.length === 0) {
                        myRet.hasError = true;
                        myRet.errorMsg = UNKNOWN_ID_ERROR;
                        return res.json(myRet);
                    }
                    
                    // On recherche le rendez-vous non confirmé avec son id incluant l'une de ces entreprises
                    Event
                        .findOneAndUpdate(
                            {
                                company: { $in: companiesList },
                                _id: mongoose.Types.ObjectId(req.body.id)
                            },
                            {
                                confirmed: true,
                                status : "cancel"
                            }
                        ).then(async (event) => {
                            // Récupération de l'adresse mail où envoyer l'information d'annulation
                            const emailToSend = (
                                event?.user ?
                                    await User.findById(event.user)?.email
                                :
                                    event?.userInfos?.email || ""
                            );

                            // Récupération des informations de RDV à afficher dans le mail
                            const companyFound = await Company.findById(event.company);
                            const startHourDate = new Date(event.startDate);
                            const endHourDate = new Date(event.endDate);

                            // Paramètres du mail d'annulation de RDV
                            const mailClientParams = {
                                to: emailToSend,
                                subject: "OKKI DOKI - Rendez-vous annulé",
                                text: ""
                            };
                            const htmlClientContent = `
                                    <p>Bonjour,</p>
        
                                    <p>
                                        Votre rendez-vous ci-dessous, a été <b style="color: rgb(224, 53, 53);">annulé</b> par l'entreprise concernée:
                                    </p>
                                    <div>
                                        <table style="
                                                margin: auto;
                                                text-align: center;
                                                border-collapse: collapse;">
                                            <tbody>
                                                <tr>
                                                    <td style="%leftTable% %topLeftTable%">
                                                        Entreprise
                                                    </td>
                                                    <td style="%rightTable% %topRightTable%">
                                                        ${companyFound.name}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="%leftTable% %bottomLeftTable%">
                                                        Date
                                                    </td>
                                                    <td style="%rightTable% %bottomRightTable%">
                                                        <div>${startHourDate.toLocaleDateString('fr-FR')}</div>
                                                        <div>De ${startHourDate.toISOString().substring(11, 16).replace(':', 'h')} à ${endHourDate.toISOString().substring(11, 16).replace(':', 'h')}</div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <p>
                                        Cordialement,<br/>
                                        <b>L'Équipe OKKI DOKI</b>
                                    </p>
                                `;

                            // Envoi du mail d'annulation
                            sendMail(mailClientParams, htmlClientContent).finally(() => {
                                return res.json("ok");
                            });
                        }).catch(err => {
                            myRet.hasError = true;
                            myRet.errorMsg = UPDATE_DATA_ERROR;
                            return res.json(myRet);
                        });
                });
        }
    });
}

//////////////////////////////
// Modifie le statut d'un rendez-vous dont on a l'accès en ADMIN
//////////////////////////////
function changeStatus (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    };

    // Params manquants
    if (!req?.body?.id
            || !req?.body?.status?.value) {
        myRet.hasError = true;
        myRet.errorMsg = MISSING_PARAM_ERROR;
        return res.json(myRet);
        
    } else if (!validator.isAlphanumeric(req.body.id)
            || !validator.isAlpha(req.body.status.value)) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    const companiesList = [];
    
    // On décode la session et ses infos 
    jwt.verify (req?.session?.admin?.session, process.env.SESSION_SECRET, (err, decoded) => {
        if (err) {
            myRet.hasError = true;
            myRet.errorMsg = UPDATE_DATA_ERROR;
            return res.json(myRet);
        } else {
            const user = decoded?.user;

            // Liste des sociétés en lien avec l'utilisateur
            // (Permet de ne pas modifier une information dont on n'a pas l'accès)
            Company
                .find({ $or: [{ mainUser: user?.id }, { users: user?.id }] })
                .then(companies => {
                    for (const company of companies) {
                        companiesList.push(company._id);
                    }

                    // Accès refusé
                    if (companies.length === 0) {
                        myRet.hasError = true;
                        myRet.errorMsg = UNKNOWN_ID_ERROR;
                        return res.json(myRet);
                    }
                    
                    // Statut à utiliser lors de la modification de données
                    let status = "";
                    switch(req.body.status.value) {
                        case 'tbp':
                            status = "tbp";
                            break;
                        case 'p':
                            status = "paid";
                            break;
                        case 'c':
                            status = "cancel";
                            break;
                        default:
                            break;
                    }

                    // On recherche le rendez-vous non confirmé avec son id incluant l'une de ces entreprises
                    Event
                        .findOneAndUpdate(
                            {
                                company: { $in: companiesList },
                                _id: mongoose.Types.ObjectId(req.body.id)
                            },
                            {
                                status : status
                            }
                        ).then(async (event) => {
                            
                            // Récupération de l'adresse mail client où envoyer le changement de statut
                            const emailToSend = (
                                event?.user ?
                                    await User.findById(event.user)?.email
                                :
                                    event?.userInfos?.email || ""
                            );
                            
                            // Récupération des informations à afficher dans le mail, concernant le changement de statut du RDV
                            const companyFound = await Company.findById(event.company);
                            const statusList = [
                                {label: "En attente de paiement", value: "tbp"},
                                {label: "Payé", value: "paid"},
                                {label: "Annulé", value: "cancel"}
                            ];
                            const statusIndex = statusList.filter(option => option.value === event.status);
                            const startHourDate = new Date(event.startDate);
                            const endHourDate = new Date(event.endDate);

                            // Paramètres du mail de changement de statut
                            const mailClientParams = {
                                to: emailToSend,
                                subject: "OKKI DOKI - Changement de statut",
                                text: ""
                            };
                            const htmlClientContent = `
                                    <p>Bonjour,</p>
        
                                    <p>
                                        Le statut d'un de vos rendez-vous a été modifié:
                                    </p>
                                    <div>
                                        <table style="
                                                margin: auto;
                                                text-align: center;
                                                border-collapse: collapse;">
                                            <tbody>
                                                <tr>
                                                    <td style="%leftTable% %topLeftTable%">
                                                        Entreprise
                                                    </td>
                                                    <td style="%rightTable% %topRightTable%">
                                                        ${companyFound.name}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="%leftTable%">
                                                        Date
                                                    </td>
                                                    <td style="%rightTable%">
                                                        <div>${startHourDate.toLocaleDateString('fr-FR')}</div>
                                                        <div>De ${startHourDate.toISOString().substring(11, 16).replace(':', 'h')} à ${endHourDate.toISOString().substring(11, 16).replace(':', 'h')}</div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="%leftTable% %bottomLeftTable%">
                                                        Statut
                                                    </td>
                                                    <td style="%rightTable% %bottomRightTable%">
                                                        ${(statusIndex.length > 0) && statusIndex[0]?.label ? statusIndex[0].label : ""}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <p>
                                        Cordialement,<br/>
                                        <b>L'Équipe OKKI DOKI</b>
                                    </p>
                                `;

                            // Envoi du mail de changement de statut
                            sendMail(mailClientParams, htmlClientContent).finally(() => {
                                return res.json("ok");
                            });
                        }).catch(err => {
                            myRet.hasError = true;
                            myRet.errorMsg = UPDATE_DATA_ERROR;
                            return res.json(myRet);
                        });
                });
        }
    });
}

//////////////////////////////
// Ajout d'un RDV depuis l'espace CLIENT
//////////////////////////////
async function addEvent (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: "Erreur lors de l'ajout du rendez-vous."
    };

    // Date d'update
    const actualDate = new Date().toISOString();

    // ID du compte client connecté actuel
    let clientId = "";
    let clientInfos;
    const paramsNoSession = {
        name: "",
        surname: "",
        email: "",
        phone: "" 
    };

    // Params manquants
    if (!req?.body?.company?.value || !req?.body?.hours?.value) {
        myRet.hasError = true;
        myRet.errorMsg = MISSING_PARAM_ERROR;
        return res.json(myRet);
    }

    Company.findById(req.body.company?.value)
        .then(async (companyFound) => {
            if (companyFound === null) {
                myRet.hasError = true;
                myRet.errorMsg = "Entreprise non reconnue.";
                return res.json(myRet);
            }
            
            const startHour = new Date(req.body.hours.value.split("_")[0]);
            const endHour = new Date(req.body.hours.value.split("_")[1]);

            let emailToSend = "";

            // Ajout d'évènement avec ou sans compte ?
            if (!req?.body?.withSession) {
                if (!req?.body?.name
                        || !req?.body?.surname
                        || !req?.body?.email
                        || !req?.body?.phone) {

                    myRet.hasError = true;
                    myRet.errorMsg = MISSING_PARAM_ERROR;
                    return res.json(myRet);
                }

                // Données du formulaire
                const {
                    name,
                    surname,
                    email,
                    phone
                } = req.body;
                
                if (!validator.isAlpha(name)
                        || !validator.isAlpha(surname)
                        || !validator.isEmail(email)
                        || !validator.isAlphanumeric(phone)) {

                    myRet.hasError = true;
                    myRet.errorMsg = FORMAT_DATA_ERROR;
                    return res.json(myRet);
                }

                // Si valide, on récupère les données
                paramsNoSession.name = name;
                paramsNoSession.surname = surname;
                paramsNoSession.email = email;
                paramsNoSession.phone = phone;

                emailToSend = email;
            } else {
                try {
                    // Récupération des données utilisateur
                    clientInfos = await getSessionInfos(req, "client");
                    if (clientInfos.hasError) {
                        myRet.hasError = true;
                        return res.json(myRet);
                    } else {
                        clientId = clientInfos?.id;

                        // Récupération de l'utilisateur et du mail
                        await User
                            .findById(clientInfos?.id)
                            .select('name surname phone email')
                            .then(resultUser => {
                                clientInfos.user = resultUser;
                                emailToSend = resultUser?.email;
                            }).catch(err => {})
                    }
                } catch(err) {
                    myRet.hasError = true;
                    return res.json(myRet);
                }
            }
            
            // Préparation des données du RDV
            const eventParams = {
                title: "Event",
                messages: [],
                startDate: startHour,
                endDate: endHour,
                status: "tbp",
                company: companyFound.id,
                confirmed: false,
                dateCreated: actualDate,
                dateUpdated: actualDate
            };

            // Informations utilisateurs (si connecté ou non)
            let clientInfosHtml = "";
            if (clientId) {
                eventParams.user = clientId;
                clientInfosHtml = (
                    `
                        <div>${clientInfos?.user?.name + " " + clientInfos?.user?.surname?.toUpperCase()}</div>
                        <div>${clientInfos?.user?.phone}</div>
                        <div>${clientInfos?.user?.email}</div>
                    `
                );
            } else {
                eventParams.userInfos = paramsNoSession;
                clientInfosHtml = (
                    `
                        <div>${paramsNoSession?.name + " " + paramsNoSession?.surname.toUpperCase()}</div>
                        <div>${paramsNoSession?.phone}</div>
                        <div>${paramsNoSession?.email}</div>
                    `
                );
            }

            // Enregistrement
            const newEvent = new Event(eventParams);
            newEvent
                .save(async (err, event) => {
                    if (err) {
                        myRet.hasError = true;
                        return res.json(myRet);
                    }

                    // Préparation des données pour l'envoi du mail
                    const companyFound = await Company.findById(event.company);
                    const startHourDate = new Date(event.startDate);
                    const endHourDate = new Date(event.endDate);

                    // paramètres du mail de demande 
                    const mailClientParams = {
                        to: emailToSend,
                        subject: "OKKI DOKI - Votre demande de rendez-vous",
                        text: ""
                    };
                    const htmlClientContent = `
                            <p>Bonjour,</p>

                            <p>
                                Par le biais de l'application OKKI DOKI, vous avez demandé la réservation du rendez-vous suivant:
                            </p>
                            <div>
                                <table style="
                                        margin: auto;
                                        text-align: center;
                                        border-collapse: collapse;">
                                    <tbody>
                                        <tr>
                                            <td style="%leftTable% %topLeftTable%">
                                                Entreprise
                                            </td>
                                            <td style="%rightTable% %topRightTable%">
                                                ${companyFound.name}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="%leftTable% %bottomLeftTable%">
                                                Date
                                            </td>
                                            <td style="%rightTable% %bottomRightTable%">
                                                <div>${startHour.toLocaleDateString('fr-FR')}</div>
                                                <div>De ${startHour.toISOString().substring(11, 16).replace(':', 'h')} à ${endHour.toISOString().substring(11, 16).replace(':', 'h')}</div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p>
                                Dans le but de valider votre rendez-vous, vous pourriez être susceptible d'être contacté par l'entreprise par téléphone ou par mail.<br/>
                                Dans le cas où aucune réponse ne serait confirmée de votre part, il est possible que ce rendez-vous soit annulé.
                            </p>
                            <p>
                                Cordialement,<br/>
                                <b>L'Équipe OKKI DOKI</b>
                            </p>
                        `;

                    // Envoi du mail de demande de RDV
                    sendMail(mailClientParams, htmlClientContent).finally(() => {
                        return res.json("ok");
                    });
                });
        }).catch(err => {
            myRet.hasError = true;
            return res.json(myRet);
        });
}

export {
    getEventsFromSession,
    getEventsFromCompany,
    getConfirmedEvent,

    confirmEvent,
    cancelEvent,
    changeStatus,

    addEvent
}
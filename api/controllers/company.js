import mongoose from "mongoose";
import validator from "validator";

import Company from "../models/company.js";
import Event from "../models/event.js";
import User from "../models/user.js";

import { getSessionInfos, isSessionValid } from "../utils/utilities.js";
import { UNKNOWN_ID_ERROR, MISSING_PARAM_ERROR, REQUIRED_AUTH_ERROR, GET_DATA_ERROR, UPDATE_DATA_ERROR, FORMAT_DATA_ERROR } from "../utils/variables.js";

// Vérification du compte utilisateur
// => MIDDLEWARE sur les droits d'une entreprise
function canManageCompanyMiddle (req, res, next) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    };

    // ID entreprise manquant
    if (!req?.body?.id) {
        myRet.hasError = true;
        myRet.errorMsg = UNKNOWN_ID_ERROR;
        return res.json(myRet);
    } else if (!validator.isAlphanumeric(req.body.id)) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    // Récupération des infos du compte connecté (ID notamment)
    getSessionInfos(req, "admin")
        .then(async (dataSession) => {

            // Si erreur: on arrête la récupération
            if (dataSession?.hasError) {
                return res.json(dataSession);
            }

            // ID manquant = récupération impossible de l'utilisateur 
            if (!dataSession?.id) {
                myRet.hasError = true;
                myRet.errorMsg = UNKNOWN_ID_ERROR;
                return res.json(myRet);
            }

            // Si superadmin = tu outrepasses la règle (pour gérer les accès des comptes)
            try {
                const resValidSuperAdmin = await isSessionValid(req?.session?.admin, "superadmin");
                if (resValidSuperAdmin?.isValid) {
                    next();
                    return;
                }
            } catch (err) {}

            // Récupération de l'utilisateur via la BDD
            User.findById (dataSession?.id, (err, user) => {
                if (user === null) {
                    myRet.hasError = true;
                    myRet.errorMsg = UNKNOWN_ID_ERROR;
                    return res.json(myRet);
                } else {
                    
                    // Si l'utilisateur est récupéré:
                    // on vérifie l'utilisateur principal de l'ntreprise
                    Company
                        .findOne({
                            "_id": req.body.id,
                            "mainUser": dataSession?.id
                        })
                        .then(companyFound => {
                            if (!companyFound?._id) {
                                myRet.hasError = true;
                                myRet.errorMsg = REQUIRED_AUTH_ERROR;
                                return res.json(myRet);
                            } else {
                                next();
                            }
                        })
                        .catch(err => {
                            myRet.hasError = true;
                            myRet.errorMsg = REQUIRED_AUTH_ERROR;
                            return res.json(myRet);
                        });
                }
            });
        });
}

//////////////////////////////
// Ajout d'une entreprise à la BDD
//////////////////////////////
function addCompany (req, res) {
    const actualDate = new Date().toISOString();
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

    // Params manquants
    if (!req.body.name
            || !req.body.email
            || !req.body.phone

            || !req.body.address
            || !req.body.cp
            || !req.body.city) {

        myRet.hasError = true;
        myRet.errorMsg = MISSING_PARAM_ERROR;
        return res.json(myRet);
    }

    // Informations du formulaire
    const {
        name,
        email,
        phone,

        address,
        suburb,
        cp,
        city
    } = req.body;

    // Validation des données
    if (!validator.isEmail(email)
            || !validator.isAlphanumeric(name.replaceAll(' ', '').replaceAll('/', '').replaceAll('-', ''))
            || !validator.isAlphanumeric(phone)
            || !validator.isAlphanumeric(address.replaceAll(' ', ''))
            || !validator.isAlphanumeric(cp)
            || !validator.isAlphanumeric(city.replaceAll(' ', ''))) {

        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    // Cas où mainUser est renseigné dans un select
    let mainUser;
    if (req?.body?.mainUser?.value) {
        if (!validator.isAlphanumeric(req.body.mainUser.value)) {
            myRet.hasError = true;
            myRet.errorMsg = FORMAT_DATA_ERROR;
            return res.json(myRet);
        }
        mainUser = req.body.mainUser.value;
    }

    // Cas où plusieurs utilisateurs de l'entreprise sont renseignés dans un select
    let users = [];
    if (req.body.users !== null) {
        for (const user of req.body.users) {
            if (user !== null) {
                users.push(user.value);
            }
        }
    }

    // Premiers horaires renseignés (donc, optionnels)
    const horaires = [];
    if (req.body.horaires !== null) {
        for (const horaire of req.body.horaires) {
            const newHoraire = {
                days: [],
                hourStart: "",
                hourEnd: ""
            };

            for (const horaireDay of horaire.days) {
                newHoraire.days.push(horaireDay.value);
            }
            newHoraire.hourStart = horaire.hourStart;
            newHoraire.hourEnd = horaire.hourEnd;

            horaires.push(newHoraire);
        }
    }

    // Raccords avec les informations du formulaire et le modèle de Company
    const newCompany = new Company ({
        name: name,
        email: email,
        phone: phone,
        adresse: {
            address: address,
            suburb: suburb,
            cp: cp, 
            city: city,
            country: "France"
        },
        mainUser: mainUser,
        users: users,
        horaires: horaires,
        dateCreated: actualDate,
        dateUpdated: actualDate
    });

    // Enregistement
    newCompany
        .save()
        .then(result => {
            res.json("OK")
        })
        .catch(err => {
            res.json("NOK")
        });
}

//////////////////////////////
// Mise à jour des informations de la société
//////////////////////////////
async function updateCompany (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

    // Infos à la mettre à jour: modification / divers
    const actualDate = new Date().toISOString();
    let elementsToUpdate = {};

    // ID ou type de modification manquant
    if (!req.body?.id || !req?.body?.typeInfos) {
        myRet.hasError = true;
        myRet.errorMsg = UNKNOWN_ID_ERROR;
        return res.json(myRet);
    }
            
    const {
        id,
        typeInfos
    } = req.body;

    if (!validator.isAlphanumeric(id)
            || !validator.isAlpha(typeInfos)) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    // Dépend de où la page a été modifiée
    switch (typeInfos) {

        // PAGES "INFOS GENERALES"
        case 'general':
            // Params manquants
            if (!req.body.name
                    || !req.body.email
                    || !req.body.phone

                    || !req.body.address
                    || !req.body.cp
                    || !req.body.city) {

                myRet.hasError = true;
                myRet.errorMsg = MISSING_PARAM_ERROR;
                return res.json(myRet);
            }

            // Données du form
            const {
                name,
                email,
                phone,

                address,
                suburb,
                cp,
                city
            } = req.body;
            
            // Validation des données
            if (!validator.isEmail(email)
                    || !validator.isAlphanumeric(name.replaceAll(' ', '').replaceAll('/', '').replaceAll('-', ''))
                    || !validator.isAlphanumeric(phone)
                    || !validator.isAlphanumeric(address.replaceAll(' ', ''))
                    || !validator.isAlphanumeric(cp)
                    || !validator.isAlphanumeric(city.replaceAll(' ', ''))) {

                myRet.hasError = true;
                myRet.errorMsg = FORMAT_DATA_ERROR;
                return res.json(myRet);
            }

            // Utilisateur principal
            let mainUser;
            if (req?.body?.mainUser?.value) {
                if (!validator.isAlphanumeric(req.body.mainUser.value)) {
                    myRet.hasError = true;
                    myRet.errorMsg = FORMAT_DATA_ERROR;
                    return res.json(myRet);
                }
                mainUser = req.body.mainUser.value;
            }

            // Utilisateurs
            let users = [];
            if (req.body?.users !== null) {
                for (const user of req.body.users) {
                    if (user !== null) {
                        users.push(user.value);
                    }
                }
            }

            // Raccordements des données à mettre à jour
            elementsToUpdate = {
                name: name,
                phone: phone,
                email: email,

                adresse: {
                    address: address,
                    suburb: suburb,
                    cp: cp,
                    city: city,
                    country: "FRANCE",
                },

                dateUpdated: actualDate
            }

            // Vérification: si super admin => on force la mise à jour des liste utilisateur
            try {
                const resValidAdmin = await isSessionValid(req?.session?.admin, "superadmin");
                if (resValidAdmin?.isValid) {
                    elementsToUpdate.mainUser = mainUser;
                    elementsToUpdate.users = users;
                }
            } catch (err) {
                myRet.hasError = true;
                myRet.errorMsg = MISSING_PARAM_ERROR;
                return res.json(myRet);
            }
            break;

        // MODIFICATION SUR LA PAGE "HORAIRES"
        case 'hours':
            // Params manquants
            if (!req?.body?.lengthEvent) {
                myRet.hasError = true;
                myRet.errorMsg = MISSING_PARAM_ERROR;
                return res.json(myRet);
            }

            const {
                lengthEvent
            } = req.body;

            // Validation des données
            if (lengthEvent <= 0) {
                myRet.hasError = true;
                myRet.errorMsg = FORMAT_DATA_ERROR;
                return res.json(myRet);
            }

            // Conversion en booléen
            const multipleEvents = !!(req?.body?.multipleEvents)

            // Liste des horaires
            const horaires = [];
            if (req.body?.horaires !== null) {
                for (const horaire of req.body.horaires) {
                    const newHoraire = {
                        days: [],
                        hourStart: "",
                        hourEnd: ""
                    };

                    // Pour chaque jour...
                    for (const horaireDay of horaire.days) {
                        newHoraire.days.push(horaireDay.value);
                    }
                    // ... Ouvert de ...h à ...h
                    newHoraire.hourStart = horaire.hourStart;
                    newHoraire.hourEnd = horaire.hourEnd;
                    horaires.push(newHoraire);
                }
            }
            
            // Elements à mettre à jour pour les horaires
            elementsToUpdate = {
                horaires: horaires,

                lengthEvent: lengthEvent,
                multipleEvents: multipleEvents
            }
            break;
        default:
            break;
    }

    // Mise à jour des infos de l'entreprise 
    Company
        .findByIdAndUpdate(id, elementsToUpdate)      
        .then(company => {
            myRet.isDone = 'OK';
            return res.json(myRet);
        }).catch(err => {
            myRet.hasError = true;
            myRet.errorMsg = UPDATE_DATA_ERROR;
            myRet.isDone = 'NOK';
            return res.json(myRet);
        });
}

//////////////////////////////
// Récupération d'une entreprise avec son ID
//////////////////////////////
function getACompany (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

    // ID entreprise manquant
    if (!req?.body?.id) {
        myRet.hasError = true;
        myRet.errorMsg = UNKNOWN_ID_ERROR;
        return res.json(myRet);
    }

    if (!validator.isAlphanumeric(req.body.id)) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    Company.findById(req.body.id)
            .populate("mainUser users")
            .then(async (company) => {
                if (company === null) {
                    myRet.hasError = true;
                    myRet.errorMsg = "Identifiant ou mot de passe incorrect.";
                    return res.json(myRet);
                } else {
                    let isSuperAdmin = false;

                    try {
                        // Si superadmin = on outrepasse le critère d'être l'un des utilisateurs (pour gérer les accès des comptes)
                        const resValidSuperAdmin = await isSessionValid(req?.session?.admin, "superadmin");
                        const userInfos = await getSessionInfos(req, "admin");
                        if (resValidSuperAdmin?.isValid) {
                            isSuperAdmin = true;
                        
                        // Si modification impossible (modification de droits entre temps)
                        } else if (!(company?.mainUser?._id).equals(mongoose.Types.ObjectId(userInfos?.id))) {
                            myRet.hasError = true;
                            myRet.errorMsg = REQUIRED_AUTH_ERROR;
                            return res.json(myRet);
                        }
                    } catch (err) {}

                    return res.json({company: company, isSuperAdmin: isSuperAdmin});
                }
            });
}

//////////////////////////////
// Récupération des horaires d'une entreprise par l'ID de l'entreprise
//////////////////////////////
function getCompanyHours (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

    // ID manquant
    if (!req?.body?.company?.value) {
        myRet.hasError = true;
        myRet.errorMsg = UNKNOWN_ID_ERROR;
        return res.json(myRet);
    } else if (!validator.isAlphanumeric(req.body.company.value)) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    // Manque de params de date
    if (!req?.body?.beginDate
            || !req?.body?.endDate) {
        myRet.hasError = true;
        myRet.errorMsg = "Période non précisée.";
        return res.json(myRet);
    }

    // Données de formulaire
    let {
        beginDate,
        endDate
    } = req.body;

    if (!validator.isDate(beginDate) || !validator.isDate(endDate)) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    /////////
    // Vérification de la période récupérée
    /////////
    const dateCheck = new Date();
    dateCheck.setDate(dateCheck.getDate()+1);

    // Si la date de fin de fin est avant demain, on ne peut pas prendre de RDV
    if (new Date(endDate+"T00:00:00.000Z").toISOString().split("T")[0] < dateCheck.toISOString().split("T")[0]) {
        return res.json({possibleEvents: []});
    }

    // On récupère les numéro de semaine de l'année 
    const beginDateCheck = new Date(beginDate+"T00:00:00.000Z");
    let yearCheck = new Date(beginDateCheck.getFullYear(), 0, 1);
    const weekBegin = Math.ceil((((beginDateCheck - yearCheck) / 86400000) + 1) / 7);
    yearCheck = new Date(dateCheck.getFullYear(), 0, 1);
    const weekCheck = Math.ceil((((dateCheck - yearCheck) / 86400000) + 1) / 7);

    // Si semaine actuelle = on décale la récupération des horaires à demain
    if (weekBegin === weekCheck
            && beginDateCheck.toISOString().split("T")[0] < dateCheck.toISOString().split("T")[0]) {
        // On passe à la date de demain
        beginDate = dateCheck.toISOString().split("T")[0];
    }
    /////////
    /////////
    /////////
    
    let myCompany = [];
    
    // Liste des horaires  par jour
    let hoursofWeek = {
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
        0: []
    };
    let eventsList = [];
    let horairesDispo = [];

    // On vérifie l'ID de l'entreprise et on récupère ses informations:
    // ID, horaires et durées des RDV
    Company
        .findById(req.body.company.value)
        .then(companyFound => {
            if (companyFound === null) {
                myRet.hasError = true;
                myRet.errorMsg = "Entreprise non reconnue.";
                return res.json(myRet);
            } else {
                myCompany = companyFound;
            }
        })
        .then(result => {
            // On récupère les évènements sélectionnés 
            Event
                .find({
                    company: req.body.company.value,
                    startDate: {
                        $gte: `${beginDate}T00:00:00.000Z`
                    },
                    endDate: {
                        $lte: `${endDate}T23:59:59.999Z`
                    },
                    status: { $not: { $regex: /^cancel$/ } }
                }) 
                .then(events => {
                    eventsList = eventsList.concat(events);
                    // Tri des horaires
                    if (Array.isArray(myCompany?.horaires) && myCompany?.horaires.length > 0) {
                        for (let horaire of myCompany.horaires) {
                            if (horaire?.days) {
                                for (let day of horaire.days) {
                                    hoursofWeek[day].push({
                                        hourStart: horaire.hourStart,
                                        hourEnd: horaire.hourEnd
                                    });
                                }
                            }
                        }
                    }

                    // Durée du RDV converti en objet Date
                    const beginDateObj = new Date(beginDate+"T00:00:00.000Z");
                    const endDateObj = new Date(endDate+"T00:00:00.000Z");
                    const diffDays = Math.ceil((endDateObj.getTime() - beginDateObj.getTime()) / (1000 * 60 * 60 * 24));

                    // Pour chaque jour de la période
                    for (let dayIndex = 0; dayIndex === 0 || dayIndex <= diffDays; dayIndex++) {
                        
                        // On initialise le jour actuel
                        const currentDate = new Date(beginDateObj.getTime());
                        currentDate.setDate(currentDate.getDate() + dayIndex);

                        // GESTION DES HORAIRES (JOUR PAR JOUR)
                        if (hoursofWeek[currentDate.getDay()].length > 0) {
                            const hoursOfTheDay = hoursofWeek[currentDate.getDay()];

                            for (let workSession of hoursOfTheDay) {
                                const {hourStart, hourEnd } = workSession;
                                const hourStartArray = hourStart.split(":");
                                const hourEndArray = hourEnd.split(":");

                                // GESTION DE LA DUREE DE RDV
                                const eventDuration = myCompany?.lengthEvent || 1;
                                
                                // GESTION DE GENERATION DE DISPO le jour X, de ...h à ...h
                                for (let hourIndex = parseInt(hourStartArray[0]);
                                        (hourIndex + eventDuration) < parseInt(hourEndArray[0])
                                        || ((hourIndex + eventDuration) === parseInt(hourEndArray[0]) && hourStartArray[1] === hourEndArray[1]);
                                        hourIndex++) {

                                    const startStr = (hourIndex <= 9 ? "0"+hourIndex : hourIndex)+":"+hourStartArray[1];
                                    const startDateObj = new Date(currentDate.toISOString().split("T")[0]+"T"+startStr+":00.000Z");

                                    const endStr = ((hourIndex + eventDuration) <= 9 ? "0"+(hourIndex + eventDuration) : (hourIndex + eventDuration))+":"+hourStartArray[1];
                                    const endDateObj = new Date(currentDate.toISOString().split("T")[0]+"T"+endStr+":00.000Z");

                                    // SI QUELQUE CHOSE EST DEJA PREVU: on ne le compte pas
                                    if (!myCompany?.multipleEvents
                                            && eventsList.filter(event => startDateObj.getTime() >= new Date(event.startDate).getTime()
                                            && endDateObj.getTime() <= new Date(event.endDate).getTime()).length > 0) {
                                        //continue;
                                    }

                                    // SINON, ON AJOUTE A LA LISTE DES HORAIRES
                                    horairesDispo.push({
                                        hourStart: startDateObj.toISOString(),
                                        hourEnd: endDateObj.toISOString()
                                    });
                                }
                            }
                        }
                    }
                    
                    return res.json({possibleEvents: horairesDispo});
                });
        });
}

//////////////////////////////
// Vérifie un créneau de RDV pour une entreprise
//////////////////////////////
function isCompanyHourValidMdw (req, res, next) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

    // Params manquants
    if (!req?.body?.company?.value || !req?.body?.hours?.value) {
        myRet.hasError = true;
        myRet.errorMsg = MISSING_PARAM_ERROR;
        return res.json(myRet);
    } else if (!validator.isAlphanumeric(req.body.company.value)) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    // Données de formulaire
    const {
        company,
        hours
    } = req.body;

    // Il n'y pas 2 dates dans l'input = Erreur de format
    if (hours.value.split("_").length !== 2) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    // Récupération des horaires
    const startHourStr = hours.value.split("_")[0];
    const endHourStr = hours.value.split("_")[1];

    // Une date n'est pas valide = Erreur de format
    if (isNaN(Date.parse(startHourStr))
            || isNaN(Date.parse(startHourStr))) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    const startHour = new Date(hours.value.split("_")[0]);
    const endHour = new Date(hours.value.split("_")[1]);

    // L'horaire n'a pas une durée valide = Erreur
    if (startHour.getTime() > endHour.getTime()) {
        myRet.hasError = true;
        myRet.errorMsg = "Horaire non valide";
        return res.json(myRet);
    }

    // Vérification des horaires correspondant à l'entreprise
    // On récupère les évènements sélectionnés 
    Event
        .find({
            company: company.value,
            startDate: {
                $gte: `${startHourStr.split("T")[0]}T00:00:00.000Z`
            },
            endDate: {
                $lte: `${startHourStr.split("T")[0]}T23:59:59.999Z`
            },
            status: { $not: { $regex: /^cancel$/ } }
        }) 
        .then(events => {

            // On récupère les horaires du jour de l'horaire sélectionné
            Company
                .find({
                        "_id": company.value,
                        horaires: {$elemMatch: { days: startHour.getDay() }}
                })
                .select("horaires multipleEvents lengthEvent")
                .then(companies => {
                    const myCompany = companies[0];
                    if (!myCompany || myCompany.length < 1) {
                        myRet.hasError = true;
                        myRet.errorMsg = "Horaire non valide";
                        return res.json(myRet);
                    }
                    
                    // Tri des horaires déjà pris
                    const eventsList = events || [];
                    const eventsHoursList = events || [];
                    if (Array.isArray(myCompany?.horaires) && myCompany.horaires.length > 0) {
                        for (let horaire of myCompany.horaires) {
                            if (horaire?.days) {
                                eventsHoursList.push({
                                    hourStart: horaire.hourStart,
                                    hourEnd: horaire.hourEnd
                                });
                            }
                        }
                    }

                    let isEventFound = false;
                    let isHourFound = false;
                    for (let workSession of myCompany.horaires) {
                        const {hourStart, hourEnd } = workSession;
                        const hourStartArray = hourStart.split(":");
                        const hourEndArray = hourEnd.split(":");

                        // GESTION DE LA DUREE DE RDV
                        const eventDuration = myCompany?.lengthEvent || 1;
                        
                        // GESTION DE CHAQUE DISPO, de ...h à ...h
                        for (let hourIndex = parseInt(hourStartArray[0]);
                                (hourIndex + eventDuration) < parseInt(hourEndArray[0])
                                || ((hourIndex + eventDuration) === parseInt(hourEndArray[0]) && hourStartArray[1] === hourEndArray[1]);
                                hourIndex++) {

                            // Durée de la disponibilité
                            const openStr = (hourIndex <= 9 ? "0"+hourIndex : hourIndex)+":"+hourStartArray[1];
                            const openHorDate = new Date(startHour.toISOString().split("T")[0]+"T"+openStr+":00.000Z");
                            const closeStr = ((hourIndex + eventDuration) <= 9 ? "0"+(hourIndex + eventDuration) : (hourIndex + eventDuration))+":"+hourStartArray[1];
                            const closeHorDate = new Date(startHour.toISOString().split("T")[0]+"T"+closeStr+":00.000Z");

                            // SI QUELQUE CHOSE EST DEJA PREVU: on ne le compte pas
                            if (!myCompany?.multipleEvents
                                    && eventsList.filter(event => openHorDate.getTime() >= new Date(event.startDate).getTime()
                                    && closeHorDate.getTime() <= new Date(event.endDate).getTime()).length > 0) {
                                isEventFound = true;
                                break;
                            }

                            // Sinon, on vérifie l'horaire
                            if (startHour.getTime() === openHorDate.getTime()
                                    && endHour.getTime() === closeHorDate.getTime()) {

                                // Trouvé = on arrête la recherche
                                isHourFound = true;
                                break;
                            }
                        }
                    }

                    if (isEventFound) {
                        myRet.hasError = true;
                        myRet.errorMsg = "Cet horaire est déjà pris. Veuillez réactualiser les disponibilités d'horaires.";
                        return res.json(myRet);
                    } else if (!isHourFound) {
                        myRet.hasError = true;
                        myRet.errorMsg = "Horaire non valide. Veuillez réactualiser les disponibilités d'horaires.";
                        return res.json(myRet);
                    } else {
                        next();
                    }
                });
        })
        .catch(err => {
            console.log(err);
            myRet.hasError = true;
            myRet.errorMsg = "Horaire non valide";
            return res.json(myRet);
        });
}

//////////////////////////////
// Liste des entreprises en fonction de la session ADMIN
//////////////////////////////
async function getCompaniesForAdmin (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    };

    let userInfos;
    try {
        // Récupération des données utilisateur
        userInfos = await getSessionInfos(req, "admin");
        if (userInfos?.hasError) {
            return res.json(myRet);
        }
    } catch(err) {
        myRet.hasError = true;
        myRet.errorMsg = UNKNOWN_ID_ERROR;
        return res.json(myRet);
    }

    // Paramètres d'affichage
    const page = req?.body?.page && !Number.isNaN(req.body.page) ? req.body.page : 1;
    const limit = 5;
    let sortBy = { $sort: {} };
    switch (req?.body?.sortMethod?.value) {
        case 'dateAsc':
            sortBy = { $sort: { "dateUpdated": 1 } };
            break;
        case 'dateDesc':
            sortBy = { $sort: { "dateUpdated": -1 } };
            break;

        default:
            sortBy = { $sort: { "name": 1 } };
            break;
    }

    const matchParams = { $match: {} };

    // Nom de l'entreprise
    if (req?.body?.nameLike) {
        if (!validator.isAlphanumeric(req.body.nameLike)) {
            myRet.hasError = true;
            myRet.errorMsg = FORMAT_DATA_ERROR;
            return res.json(myRet);
        }
        matchParams.$match.name = {$regex : req.body.nameLike.trim(), $options: "i"};
    }
    
    let isSuperAdmin = false;
    try {
        const resValidSuperAdmin = await isSessionValid(req?.session?.admin, "superadmin");

        // Si superadmin: tu affiches toutes les sociétés,
        // sinon, on cherche la sesison actuelle en admin principal, ou en admin classique 
        if (!resValidSuperAdmin?.isValid) {
            matchParams.$match = {
                ...matchParams.$match,
                $or: [
                    { "mainUser": mongoose.Types.ObjectId(userInfos?.id) },
                    { "users": mongoose.Types.ObjectId(userInfos?.id) }
                ]
            }
        } else {
            isSuperAdmin = true;
        }
    } catch (err) {}

    // Nombre d'entreprises avec les critères voulus
    Company
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

            const count = Math.max(resCount, 1);
            const skipParam = (Math.min(page, Math.ceil(count / limit))-1) * limit;
            
            // Paramètres de recherche - Liste des entreprises
            let aggrParams = [
                matchParams,
                {$lookup: {
                    from: "users",
                    localField: "mainUser",
                    foreignField: "_id",
                    as: "mainUser"
                }},
                {$project: {
                    _id: 1, "name": 1, "email": 1, "phone": 1, "mainUser": {$arrayElemAt: ["$mainUser", 0]}, "dateUpdated": 1,
                    "isEditable": {$eq: [{$arrayElemAt: ["$mainUser._id", 0]}, mongoose.Types.ObjectId(userInfos?.id)]}
                }},
                {$group: {
                    _id: null,
                    count: { $sum: 1 },
                    data: {$push: "$$ROOT"}
                }},
                {$unwind: "$data"},
                {$replaceRoot: {newRoot: "$data"}},
                sortBy,
            ];

            // Version alégé de la liste des entreprises
            if (!req?.body?.isList) {
                aggrParams.push({$skip: skipParam});
                aggrParams.push({$limit: limit});
            }
            
            // Agrégat de liste des entreprises
            Company.aggregate(aggrParams)
                .then(companies => {
                    let finalCompanies = [...companies];
                    if (isSuperAdmin) {
                        finalCompanies = finalCompanies.map((company) => {
                            company.isEditable = true;
                            return company;
                        });
                    }

                    // Renvoi des éléments
                    return res.json({
                        count: resCount || 0,
                        data: finalCompanies
                    });
                })
                .catch(err => {
                    myRet.hasError = true;
                    myRet.errorMsg = GET_DATA_ERROR;
                    return res.json(myRet);
                });
        });
}

//////////////////////////////
// Liste des entreprises allégé en informations
//////////////////////////////
function getCompaniesLight (req, res) {
    Company.aggregate([
            { $project: { _id: 1, "name": 1, "img": 1 } },
            { $sort: { "name": 1 } }
        ])
        .then(companies => {
            res.json(companies || []);
        });
}

//////////////////////////////
// Suppression d'une société
//////////////////////////////
function deleteCompany (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    };

    // ID manquant
    if (!req?.body?.id) {
        myRet.hasError = true;
        myRet.errorMsg = UNKNOWN_ID_ERROR;
        return res.json(myRet);
    } else if (!validator.isAlphanumeric(req.body.id)) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    Company.deleteOne({ "_id": req.body.id})
        .then(result => {
            return res.json("OK");
        })
        .catch(err => {
            myRet.hasError = true;
            myRet.errorMsg = "Erreur lors de la suppression de l'élément.";
            return res.json(myRet);
        });
}

export {
    canManageCompanyMiddle, 

    addCompany,
    updateCompany,
    deleteCompany,
    getACompany,
    getCompaniesForAdmin,
    getCompaniesLight,

    getCompanyHours,
    isCompanyHourValidMdw
}
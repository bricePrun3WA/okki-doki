import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import validator from "validator";

import User from "../models/user.js";
import Event from "../models/event.js";

import { sendMail } from "./mail.js";
import { decryptElement, encryptElement, getSessionInfos, isSessionValid } from "../utils/utilities.js";
import { UNKNOWN_ID_ERROR, MISSING_PARAM_ERROR, GET_DATA_ERROR, UPDATE_DATA_ERROR, FORMAT_DATA_ERROR } from "../utils/variables.js";

const saltRounds = 10;

//////////////////////
// Ajout d'un utilisateur dans l'espace CLIENT
//////////////////////
function registerUser (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

    // Params manquants
    if (!req.body.name
            || !req.body.surname
            || !req.body.birthdate
            || !req.body.phone
            || !req.body.email
            || !req.body.address
            || !req.body.cp
            || !req.body.city
            || !req.body.pwd
            || !req.body.dupPwd) {

        myRet.hasError = true;
        myRet.errorMsg = MISSING_PARAM_ERROR;
        return res.json(myRet);
    }

    // Données du formulaire
    const {
        name,
        surname,
        email,
        phone,
        birthdate,

        address,
        suburb,
        cp,
        city,

        pwd,
        dupPwd
    } = req.body;
                
    if (!validator.isAlpha(name.replaceAll(' ', '').replaceAll('-', ''))
            || !validator.isAlpha(surname.replaceAll(' ', '').replaceAll('-', ''))
            || !validator.isEmail(email)
            || !validator.isAlphanumeric(phone)
            || !validator.isDate(birthdate)
            || !validator.isAlphanumeric(address.replaceAll(' ', ''))
            || !validator.isAlphanumeric(cp)
            || !validator.isAlphanumeric(city.replaceAll(' ', ''))) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    // Pas le même MDP rentré
    if (pwd !== dupPwd) {
        myRet.hasError = true;
        myRet.errorMsg = "Les mots de passe renseignés ne sont pas identiques.";
        return res.json(myRet);
    }

    // Check email existant
    User
        .findOne({ email: email })
        .then(result => {
            
            // Si l'on trouve une ligne avec le mail saisi = ERREUR
            if (result !== null) {
                myRet.hasError = true;
                myRet.errorMsg = "Le mail saisi est déjà utlisé.";
                return res.json(myRet);
            }

            // Encryptage du MDP avant de l'insérer en BDD
            bcrypt
                .hash(pwd, saltRounds)
                .then(function(cryptedPwd) {

                    // Gestion des dates
                    const actualDate = new Date().toISOString();
                    const myBirthDate = new Date(birthdate).toISOString();

                    // Création de l'utilisateur
                    const newUser = new User ({
                        name: name,
                        surname: surname,
                        birthDate: myBirthDate,
                        email: email,
                        phone: phone,
                        pwd: cryptedPwd,
                        adresse: {
                            address: address,
                            suburb: suburb,
                            cp: cp, 
                            city: city,
                            country: "France"
                        },
                        isVerified: false,
                        roles: ["user"],
                        dateCreated: actualDate,
                        dateUpdated: actualDate
                    });

                    // Enregistrement de l'utilsateur
                    newUser
                        .save()
                        .then(async (result) => {
                            const mailEncrypted = await encryptElement(email);

                            // Paramètres du mail de validation de compte
                            const mailParams = {
                                to: email,
                                subject: 'OKKI DOKI - Vérification de votre mot de passe',
                                text: ""
                            };
                            const htmlContent = `
                                    <p>Bonjour,</p>
                    
                                    <p>
                                        Suite à votre récente inscription sur l'application OKKI DOKI,
                                        votre compte doit être activé pour pouvoir êtré utilisé. veuillez activer votre compte via le lien suivant:
                                    </p>
                                    <p style="%textAlign%">
                                        <a style="%buttonCss%%buttonSuccess%" href=${"http://localhost:3000/verify/"+result.id+"/"+mailEncrypted}>
                                            Valider le compte
                                        </a>
                                    </p>
                                    <p>
                                        (Dans le cas où vous n'avez créé aucun compte sur ce site, veuillez ne pas prendre en compte ce mail.)
                                    </p>
                                    <p>
                                        Cordialement,<br/>
                                        <b>L'Équipe OKKI DOKI</b>
                                    </p>
                                `;
                            
                            // Envoi d'un mail de validation de compte
                            sendMail(mailParams, htmlContent).then(data => {

                                // Si OK, on renvoie l'objet
                                return res.json("OK");
                            }).catch(err => {

                                // Erreur lors de l'envoi de mail
                                return res.json("NOK");
                            });
                        });
                });
        });
}

//////////////////////
// Ajout d'un utilisateur dans l'espace ADMIN
//////////////////////
function addUser (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

    // Params manquants
    if (!req.body.name
            || !req.body.surname
            || !req.body.birthdate
            || !req.body.phone
            || !req.body.email
            || !req.body.address
            || !req.body.cp
            || !req.body.city
            || !req.body.pwd
            || !req.body.dupPwd) {

        myRet.hasError = true;
        myRet.errorMsg = MISSING_PARAM_ERROR;
        return res.json(myRet);
    }

    // Données du formulaire
    const {
        name,
        surname,
        email,
        phone,
        birthdate,

        address,
        suburb,
        cp,
        city,

        pwd,
        dupPwd
    } = req.body;
                
    if (!validator.isAlpha(name.replaceAll(' ', ''))
            || !validator.isAlpha(surname.replaceAll(' ', ''))
            || !validator.isEmail(email)
            || !validator.isAlphanumeric(phone)
            || !validator.isDate(birthdate)
            || !validator.isAlphanumeric(address.replaceAll(' ', ''))
            || !validator.isAlphanumeric(cp)
            || !validator.isAlphanumeric(city.replaceAll(' ', ''))) {
        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    // Pas le même MDP rentré
    if (pwd !== dupPwd) {
        myRet.hasError = true;
        myRet.errorMsg = "Les mots de passe renseignés ne sont pas identiques.";
        return res.json(myRet);
    }

    // Check email existant
    User
        .findOne({ email: email })
        .then(result => {
            // Si l'on trouve une ligne avec le mail saisi = ERREUR
            if (result !== null) {
                myRet.hasError = true;
                myRet.errorMsg = "Le mail saisi est déjà utlisé.";
                return res.json(myRet);
            }

            // Encryptage du MDP avant de l'insérer en BDD
            bcrypt
                .hash(pwd, saltRounds)
                .then(function(cryptedPwd) {

                    // Gestion des dates
                    const actualDate = new Date().toISOString();
                    const myBirthDate = new Date(birthdate).toISOString();

                    // Création de l'utilisateur
                    const newUser = new User ({
                        name: name,
                        surname: surname,
                        birthDate: myBirthDate,
                        email: email,
                        phone: phone,
                        pwd: cryptedPwd,
                        adresse: {
                            address: address,
                            suburb: suburb,
                            cp: cp, 
                            city: city,
                            country: "France"
                        },
                        isVerified: false,
                        roles: ["user"],
                        dateCreated: actualDate,
                        dateUpdated: actualDate
                    });

                    // Enregistrement de l'utilisateur
                    newUser
                        .save()
                        .then(result => {
                            res.json("OK")
                        });
                });
        });
}

////////////////////////
// Fonction de validation du compte
////////////////////////
async function validateUser (req, res) {

    // ID manquant
    if (!req?.body?.id || !req?.body?.key) {
        return res.json("NOK");
    }
    
    // Erreur de format
    if (!validator.isAlphanumeric(req.body.id)
            || !validator.isAlphanumeric(req?.body?.key)) {
        return res.json("NOK");
    }

    let decryptedKey = "";
    try {
        decryptedKey = await decryptElement(req?.body?.key);
    } catch(e) {
        return res.json("NOK");
    };

    // Modification de la propriété "confirmed" pour l'ID utilisateur
    User
        .findOneAndUpdate(
            { "_id": req.body.id, "email": decryptedKey },
            { isVerified : true }
        )
        .then(result => {
            return res.json("OK");
        })
        .catch(err => {
            return res.json("NOK");
        });
}

////////////////////////
// Connexion de l'utilisateur
////////////////////////
function loginUser (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }
    
    // Params manquants
    if (!req?.body?.email || !req?.body?.pwd || !req?.body?.espace) {
        myRet.hasError = true;
        myRet.errorMsg = MISSING_PARAM_ERROR;
        return res.json(myRet);
    }
    
    // Erreur de format
    if (!validator.isEmail(req.body.email)
            || !validator.isAlphanumeric(req.body.pwd)
            || !validator.isAlphanumeric(req.body.espace)) {
        return res.json("NOK");
    }

    // Récupération de quel rôle est nécessaire à la connexion
    let roleNeeded = "";
    switch (req.body.espace) {
        case "client":
            roleNeeded = "client";
            break;
        default:
            roleNeeded = "admin";
            break;
    }

    // Check du mail et du rôle correspondant au compte
    User.findOne(
            {
                email: req.body.email,
                roles: roleNeeded
            },
            (err, user) => {
                // Si aucun utilisateur admin n'a été trouvé = ERREUR
                if (user === null) {
                    myRet.hasError = true;
                    myRet.errorMsg = "Identifiant ou mot de passe incorrect.";
                    
                    return res.json(myRet);
                
                // Compte pas encore validé
                } else if (!user?.isVerified) {
                    myRet.hasError = true;
                    myRet.errorMsg = "Veuiller valider votre compte pour vous connecter.";
                    
                    return res.json(myRet);
                } else {

                    // Vérification du MDP encrypté
                    bcrypt 
                        .compare(req.body.pwd, user.pwd)
                        .then(function(isMatching) {

                            // Si le mot de passe n'est pas correct = ERREUR
                            if (!isMatching) {
                                myRet.hasError = true;
                                myRet.errorMsg = "Identifiant ou mot de passe incorrect.";

                                return res.json(myRet);

                            // Sinon, on renvoie les infos utilisateur
                            } else {

                                // Création du token JWT
                                const jwtAccess = jwt.sign(
                                    {
                                        "user": {
                                            "id": user._id,
                                            "roles": user.roles
                                        }
                                    },
                                    process.env.SESSION_SECRET,

                                    // 1 jour de token
                                    { expiresIn: '1d' }
                                );

                                // Mise à jour du rôle de session
                                switch (roleNeeded) {
                                    case "client":
                                        req.session.client = {
                                            isLogged: true,
                                            session:jwtAccess
                                        };
                                        break;
                                    default:
                                        req.session.admin = {
                                            isLogged: true,
                                            session:jwtAccess
                                        };
                                        break;
                                }
                                myRet.isLogged = true;
                                return res.json(myRet);
                            }
                    });
                }
            });
}

////////////////////////
// Déconnexion de l'utilisateur en fonction de l'espace demandé
////////////////////////
function logoutUser (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }
    
    // Params manquants
    if (!req?.body?.espace || !validator.isAlphanumeric(req.body.espace)) {
        myRet.hasError = true;
        myRet.errorMsg = "Erreur de déconnexion";
        return res.json(myRet);
    }

    try {        
        switch (req.body.espace) {
            case "client":
                req.session.client = {
                    isLogged: false,
                    session: ""
                };
                break;
            default:
                req.session.admin = {
                    isLogged: false,
                    session: ""
                };
                break;
        }
        myRet.isLogged = false;
        return res.json(myRet);

    // Erreur
    } catch(e) {
        myRet.hasError = true;
        myRet.errorMsg = "Erreur de déconnexion";
        return res.json(myRet);
    };
}

////////////////////////
// Vérification de la session, et du rôle demandé
////////////////////////
function checkSession (req, res) {
    
    // Params manquants
    if (!req?.body?.espace) {
        return res.json({ isValid: false });
    }
    
    // Stockage du rôle demandé
    let roleNeeded = "";
    let sessionToCheck = "";
    switch (req.body.espace) {
        case "client":
            roleNeeded = "client";
            sessionToCheck = req?.session?.client;
            break;
        case "admin":
            roleNeeded = "admin";
            sessionToCheck = req?.session?.admin;
            break;
        default:
            roleNeeded = "superadmin";
            sessionToCheck = req?.session?.admin;
            break;
    }

    // token manquant
    if (!sessionToCheck) {
        return res.json({ isValid: false, needLogout: true });
    }

    // Vérifie la validité de la session et du rôle demandé
    isSessionValid(sessionToCheck, roleNeeded)
        .then(data => {
            return res.json(data);
        })
        .catch(err => {
            return res.json({ isValid: false });
        });
}

////////////////////////
// MIDDLEWARE: Vérification de la session
////////////////////////
function checkSessionMiddle (req, res, next) {
    // token manquant
    if (!req?.session?.client?.session) {
        return res.json({ isValid: false, needLogout: true });
    }

    // Vérifie la validité de la session et du rôle CLIENT
    isSessionValid(req?.session?.client, "client")
        .then(data => {            
            if (!data?.isValid) {
                res.json(data);
            } else {
                next();
            }
        })
        .catch(err => {
            return res.json({ isValid: false });
        });
}

////////////////////////
// MIDDLEWARE: Vérification de la session ADMIN
////////////////////////
function checkSessionAdminMiddle (req, res, next) {
    // token manquant
    if (!req?.session?.admin?.session) {
        return res.json({ isValid: false, needLogout: true });
    }

    // Vérifie la validité de la session et du rôle ADMIN (ou plus)
    isSessionValid(req?.session?.admin, "admin")
        .then(data => {            
            if (!data?.isValid) {
                res.json(data);
            } else {
                next();
            }
        })
        .catch(err => {
            return res.json({ isValid: false });
        });
}

////////////////////////
// MIDDLEWARE: Vérification de la session SUPER ADMIN
////////////////////////
function checkSessionSuperAdminMiddle (req, res, next) {
    // token manquant
    if (!req?.session?.admin?.session) {
        return res.json({ isValid: false, needLogout: true });
    }

    // Vérifie la validité de la session et du rôle ADMIN (ou plus)
    isSessionValid(req?.session?.admin, "superadmin")
        .then(data => {
            if (!data?.isValid) {
                res.json(data);
            } else {
                next();
            }
        })
        .catch(err => {
            return res.json({ isValid: false });
        });
}

////////////////////////
// Récupération des liens accessibles demandant un droit
////////////////////////
function getAdminMenuLinks (req, res) {
    let listLinks = [];

    // token manquant
    if (!req?.session?.admin?.session) {
        return res.json({ links: listLinks });
    }

    // Vérification du token de session et récupération des données
    jwt.verify(req?.session?.admin?.session, process.env.SESSION_SECRET, (err, decoded) => {
        if (err) {
            return res.json({ links: listLinks });
        } else {
            const userRoles = decoded?.user?.roles || [];

            // Si un rôle match, on rajoute chacun des accès
            if (userRoles.includes("admin")) {
                listLinks = listLinks.concat([
                    "companies",
                    "events"
                ]);
            }
            if (userRoles.includes("superadmin")) {
                listLinks.push("users");
            }
            //////////////////////////
        }

        return res.json({ links: listLinks });
    });
}

//////////////////////////////
// Mise à jour SUPER ADMIN d'un profil
//////////////////////////////
function updateUser (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

    // Params manquants
    if (!req.body.id
            || !req.body.name
            || !req.body.surname
            || !req.body.birthdate
            || !req.body.email
            || !req.body.phone
            || !req.body.address
            || !req.body.cp
            || !req.body.city
            || !req.body.pwd
            || !req.body.dupPwd) {

        myRet.hasError = true;
        myRet.errorMsg = MISSING_PARAM_ERROR;
        return res.json(myRet);
    }

    // Données du formulaire
    const {
        id,

        name,
        surname,
        email,
        phone,
        birthdate,

        address,
        suburb,
        cp,
        city,

        pwd,
        dupPwd
    } = req.body;
            
    // Validation des données
    if (!validator.isEmail(email)
            || !validator.isAlphanumeric(name.replaceAll(' ', '').replaceAll('-', ''))
            || !validator.isAlphanumeric(surname.replaceAll(' ', '').replaceAll('-', ''))
            || !validator.isAlphanumeric(phone)
            || !validator.isAlphanumeric(address.replaceAll(' ', ''))
            || !validator.isAlphanumeric(cp)
            || !validator.isAlphanumeric(city.replaceAll(' ', ''))) {

        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    // Pas le même MDP rentré
    if (pwd !== dupPwd) {
        myRet.hasError = true;
        myRet.errorMsg = "Les mots de passe renseignés ne sont pas identiques.";

        return res.json(myRet);
    }

    // Gestion des dates
    const actualDate = new Date().toISOString();
    const myBirthDate = new Date(birthdate).toISOString();

    // Mise à jour des infos capitales du compte 
    User.findOneAndUpdate(
            { "_id": id },
            {
                name: name,
                surname: surname,
                email: email,
                phone: phone,
                birthdate: myBirthDate,
        
                address: address,
                suburb: suburb,
                cp: cp,
                city: city,

                dateUpdated: actualDate
            }
        ).then(user => {
            res.json('OK');
        }).catch(err => {
            res.json('NOK');
        });
}

//////////////////////////////
// Mise à jour de certaines infos d'un profil
//////////////////////////////
async function updateInfos (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

    // Params manquants
    if (!req.body.name
            || !req.body.surname
            || !req.body.birthdate
            || !req.body.phone
            || !req.body.address
            || !req.body.cp
            || !req.body.city
            || !req.body.pwd) {

        myRet.hasError = true;
        myRet.errorMsg = MISSING_PARAM_ERROR;
        return res.json(myRet);
    }

    // Données de formulaire
    const {
        name,
        surname,
        phone,
        birthdate,

        address,
        suburb,
        cp,
        city,

        pwd
    } = req.body;
            
    // Validation des données
    if (!validator.isEmail(email)
            || !validator.isAlphanumeric(name.replaceAll(' ', '').replaceAll('-', ''))
            || !validator.isAlphanumeric(surname.replaceAll(' ', '').replaceAll('-', ''))
            || !validator.isAlphanumeric(phone)
            || !validator.isAlphanumeric(address.replaceAll(' ', ''))
            || !validator.isAlphanumeric(cp)
            || !validator.isAlphanumeric(city.replaceAll(' ', ''))) {

        myRet.hasError = true;
        myRet.errorMsg = FORMAT_DATA_ERROR;
        return res.json(myRet);
    }

    // Récupération du compte connecté actuel
    let id = "";
    try {
        // Récupération des données utilisateur
        const userInfos = await getSessionInfos(req, "admin");
        if (userInfos.hasError) {
            return res.json(myRet);
        } else {
            id = userInfos.id;
        }
    } catch(err) {
        myRet.hasError = true;
        myRet.errorMsg = UNKNOWN_ID_ERROR;
        return res.json(myRet);
    }

    // Si aucun ID utilisateur n'est récupéré => Erreur
    if (!id) {
        myRet.hasError = true;
        myRet.errorMsg = UNKNOWN_ID_ERROR;
        return res.json(myRet);
    }

    // Gestion des dates
    const actualDate = new Date().toISOString();
    const myBirthDate = new Date(birthdate).toISOString();

    // Vérification du mot de passe utilisateur avant de pouvoir modifier les données
    User.findOne(
        { "_id": id }
    ).then(user => {
        if (!user) {
            myRet.hasError = true;
            myRet.errorMsg = UNKNOWN_ID_ERROR;
            return res.json(myRet);
        }
        
        // On compare ce qui a été saisie au vrai mdp
        bcrypt 
            .compare(req.body.pwd, user.pwd)
            .then(function(isMatching) {

                // Pas le bon mdp
                if (!isMatching) {
                    myRet.hasError = true;
                    myRet.errorMsg = "Mot de passe incorrect.";
                    return res.json(myRet);
                }

                // Si correct, mise à jour des infos du compte 
                User.findOneAndUpdate(
                    { "_id": id },
                    {
                        name: name,
                        surname: surname,
                        phone: phone,
                        birthdate: myBirthDate,
                
                        address: address,
                        suburb: suburb,
                        cp: cp,
                        city: city,

                        dateUpdated: actualDate
                    }
                ).then(user => {
                    res.json('OK');
                }).catch(err => {

                    // Erreur générale
                    myRet.hasError = true;
                    myRet.errorMsg = UPDATE_DATA_ERROR;
                    return res.json(myRet);
                });
            }).catch(err => {

                // Erreur générale
                myRet.hasError = true;
                myRet.errorMsg = "Mot de passe incorrect.";
                return res.json(myRet);
            });
    }).catch(err => {

        // Erreur générale
        myRet.hasError = true;
        myRet.errorMsg = "Mot de passe incorrect.";
        return res.json(myRet);
    });
}

//////////////////////////////
// Récupération d'un CLIENT par son compte
//////////////////////////////
function getClientUserFromSession (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

    getSessionInfos(req, "client")
        .then(data => {
            if (data?.hasError) {
                return res.json(data);
            }

            // ID manquant
            if (!data?.id) {
                myRet.hasError = true;
                myRet.errorMsg = UNKNOWN_ID_ERROR;
                return res.json(myRet);
            }

            User.findById (data.id, (err, user) => {
                if (user === null) {
                    myRet.hasError = true;
                    myRet.errorMsg = UNKNOWN_ID_ERROR;
                    return res.json(myRet);
                } else {
                    return res.json(user);
                }
            });
        });
}

//////////////////////////////
// Récupération d'un ADMIN par son compte
//////////////////////////////
function getAdminUserFromSession (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }
    
    getSessionInfos(req, "admin")
        .then(data => {
            if (data?.hasError) {
                return res.json(data);
            }

            // ID manquant
            if (!data?.id) {
                myRet.hasError = true;
                myRet.errorMsg = UNKNOWN_ID_ERROR;
                return res.json(myRet);
            }

            User.findById (data.id, (err, user) => {
                if (user === null) {
                    myRet.hasError = true;
                    myRet.errorMsg = UNKNOWN_ID_ERROR;
                    return res.json(myRet);
                } else {
                    return res.json(user);
                }
            });
        });
}

//////////////////////////////
// Récupération d'un utilisateur par son ID
//////////////////////////////
function getAUser (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

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

    User.findById (req.body.id, (err, user) => {
        if (user === null) {
            myRet.hasError = true;
            myRet.errorMsg = "L'utilisateur n'existe pas.";
            return res.json(myRet);
        } else {
            return res.json(user);
        }
    });
}

//////////////////////////////
// Liste des utilisateurs
//////////////////////////////
function getUsers (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: GET_DATA_ERROR
    }

    // Paramètres d'affichage
    const page = req?.body?.page && !Number.isNaN(req?.body?.page) ? req?.body?.page : 1;
    const limit = 5;
    let sortBy = { "dateUpdated": -1 };
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
            break;
    }

    // Critères de sélection
    let matchParams = {};

    // Prénom
    if (req?.body?.name) {
        if (!validator.isAlphanumeric(req.body.name.replaceAll(' ','').replaceAll('-',''))) {
            myRet.hasError = true;
            myRet.errorMsg = FORMAT_DATA_ERROR;
            return res.json(myRet);
        }
        matchParams.name = {$regex : req.body.name.trim(), $options: "i"};
    }
    // Nom
    if (req?.body?.surname) {
        if (!validator.isAlphanumeric(req.body.surname.replaceAll(' ','').replaceAll('-',''))) {
            myRet.hasError = true;
            myRet.errorMsg = FORMAT_DATA_ERROR;
            return res.json(myRet);
        }
        matchParams.surname = {$regex : req.body.surname.trim(), $options: "i"};
    }
    // Adresse mail
    if (req?.body?.email) {
        if (!validator.isEmail(req.body.email)) {
            myRet.hasError = true;
            myRet.errorMsg = FORMAT_DATA_ERROR;
            return res.json(myRet);
        }
        matchParams.email = {$regex : req.body.email.trim(), $options: "i"};
    }
    // Téléphone
    if (req?.body?.phone) {
        matchParams.phone = {$regex : req.body.phone.trim(), $options: "i"};
    }

    // Requête: nombre d'utilisateurs
    User
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

            // Requête: liste des utilisateurs
            User
                .find(matchParams)
                .select('_id name surname email phone roles')
                .select('-pwd')
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

//////////////////////////////
// Liste des utilisateurs alégéée
//////////////////////////////
function getUsersLight (req, res) {
    User.find({})
        .select("_id name surname")
        .sort({"surname": 1 })
        .then(users => {
            res.json(users || []);
        });
}

//////////////////////////////
// Suppression d'un utilisateur
//////////////////////////////
function deleteUser (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: ""
    }

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

    User.deleteOne({ "_id": req.body.id})
        .then(result => {
            return res.json("OK");
        })
        .catch(err => {
            myRet.hasError = true;
            myRet.errorMsg = "Erreur lors de la suppression de l'élément.";

            return res.json(myRet);
        });
}

//////////////////////////////
// Suppression d'un utilisateur
//////////////////////////////
function getHomeStats (req, res) {
    const myRet = {
        hasError: false,
        errorMsg: GET_DATA_ERROR
    }

    // On décode la session et ses infos 
    jwt.verify (req?.session?.admin?.session, process.env.SESSION_SECRET, async (err, decoded) => {
        if (err) {
            myRet.hasError = true;
            return res.json(myRet);
        } else {
            const user = decoded?.user;
            if (!user) {
                myRet.hasError = true;
                return res.json(myRet);
            }

            const companiesList = [];
            try {
                // Si SUPER ADMIN: tu affiches tous les évents
                const resValidSuperAdmin = await isSessionValid(req?.session?.admin, "superadmin");
                if (!resValidSuperAdmin?.isValid) {
                    let returnedValue;

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
                        matchOldMonthParams.company = { $in: companiesList };
                    }
                }
            } catch (err) {
                myRet.hasError = true;
                return res.json(myRet);
            }
    
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
        
            // Paramètre de recherche
            const matchParams = {};
            const matchOldMonthParams = {};
            const matchUsersParams = {};
            const matchUsersOMParams = {};

            // Premier jour du mois
            const dateBegin = new Date();
            dateBegin.setDate(1);
            dateBegin.setHours(1, 0, 0, 0);
            matchParams.startDate = {$gte : dateBegin};
            
            // Dernier jour du mois
            const dateEnd = new Date();
            dateEnd.setMonth(dateEnd.getMonth()+1);
            dateEnd.setDate(1);
            dateEnd.setHours(0, 59, 59, 999);
            matchParams.endDate = {$lte : dateEnd};

            // Entreprise ciblée si recherchée
            if (req?.body?.company?.value) {
                matchParams.company = mongoose.Types.ObjectId(req.body.company.value);
                matchOldMonthParams.company = mongoose.Types.ObjectId(req.body.company.value);

                matchUsersParams.company = mongoose.Types.ObjectId(req.body.company.value);
                matchUsersOMParams.company = mongoose.Types.ObjectId(req.body.company.value);
            }

            const retStats = {
                countRdv: 0,
                countOMRdv: 0,

                nbUsers: 0,
                nbOMUsers: 0,
                nbNoAccUsers: 0,
                nbNoAccOMUsers: 0
            };
            
            // On cherche le nombre de commandes du mois
            await Event
                .find(matchParams)
                .count()
                .then(resCount => {
                    retStats.countRdv = resCount;
                })
                .catch(err => {
                    myRet.hasError = true;
                    return res.json(myRet);
                });
            if (myRet.hasError) {
                return res.json(myRet);
            }
            
            // Premier jour du mois précédent
            const monthDateBegin = new Date();
            monthDateBegin.setMonth(monthDateBegin.getMonth()-1);
            monthDateBegin.setDate(1);
            monthDateBegin.setHours(1, 0, 0, 0);
            matchOldMonthParams.startDate = {$gte : monthDateBegin};
            
            // Dernier jour du mois précédent
            const monthDateEnd = new Date();
            monthDateEnd.setDate(1);
            monthDateEnd.setHours(0, 59, 59, 999);
            matchOldMonthParams.endDate = {$lte : monthDateEnd};

            // On cherche le nombre de commandes du mois dernier
            await Event
                .find(matchOldMonthParams)
                .count()
                .then(resCount => {
                    retStats.countOMRdv = resCount;
                })
                .catch(err => {
                    myRet.hasError = true;
                    return res.json(myRet);
                });
            if (myRet.hasError) {
                return res.json(myRet);
            }

            const aggrParams = [
                {$lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }},
                {$project: {
                    _id: 1, "user": 1, "user": "$user", "userCreated": "$user.dateCreated", "company" : 1
                }},
                {$match: {
                    ...matchUsersParams,
                    
                    $and: [
                        {userCreated: matchParams.startDate},
                        {userCreated: matchParams.endDate}
                    ]
                }},
                {$group: {
                    _id: "$user._id",
                    count: { $sum: 1 }
                }},
                {$group: {
                    _id: null,
                    count: { $sum: 1 }
                }}
            ];

            // On cherche le nombre de'utilsateur du mois
            await Event
                .aggregate(aggrParams)
                .then(nbUsers => {
                    retStats.nbUsers = nbUsers ? nbUsers[0]?.count : 0;
                }).catch(err => {
                    myRet.hasError = true;
                    return res.json(myRet);
                });

            // Utilisateurs inscrits avec un compte le mois dernier
            const aggrOMParams = [...aggrParams];
            aggrOMParams[2] = {$match: {
                ...matchUsersOMParams,
                
                $and: [
                    {userCreated: matchOldMonthParams.startDate},
                    {userCreated: matchOldMonthParams.endDate}
                ]
            }};
            await Event
                .aggregate(aggrOMParams)
                .then(nbUsers => {
                    retStats.nbOMUsers = nbUsers ? nbUsers[0]?.count : 0;
                }).catch(err => {
                    myRet.hasError = true;
                    return res.json(myRet);
                });
            
            // Utilisateurs inscrits sans compte le mois dernier  
            const aggrNoAcc = [
                {$project: {
                    _id: 1, "userInfos": 1, "dateCreated": 1, "company" : 1
                }},
                {$match: {
                    ...matchUsersParams,

                    userInfos : {$exists: true},
                    $and: [
                        {dateCreated: matchOldMonthParams.startDate},
                        {dateCreated: matchOldMonthParams.endDate}
                    ]
                }},
                {$group: {
                    _id: "$userInfos.email",
                    count: { $sum: 1 }
                }},
                {$group: {
                    _id: null,
                    count: { $sum: 1 }
                }}
            ];
            await Event
                .aggregate(aggrNoAcc)
                .then(nbUsers => {
                    retStats.nbNoAccUsers = nbUsers ? nbUsers[0]?.count : 0;
                }).catch(err => {
                    myRet.hasError = true;
                    return res.json(myRet);
                });            

            // Utilisateurs inscrits sans compte le mois dernier
            const aggrOMNoAcc = [...aggrNoAcc];
            aggrOMNoAcc[2] = {$match: {
                ...matchUsersOMParams,
                
                userInfos : {$exists: true},
                $and: [
                    {dateCreated: matchOldMonthParams.startDate},
                    {dateCreated: matchOldMonthParams.endDate}
                ]
            }};
            await Event
                .aggregate(aggrOMNoAcc)
                .then(nbUsers => {
                    retStats.nbNoAccOMUsers = nbUsers ? nbUsers[0]?.count : 0;
                }).catch(err => {
                    myRet.hasError = true;
                    return res.json(myRet);
                });

            // Renvoi de tous les chiffres
            return res.json(retStats);
        }
    });
}

export {
    registerUser,
    addUser,
    validateUser,
    loginUser,
    logoutUser,

    checkSession,
    checkSessionMiddle,
    checkSessionAdminMiddle,
    checkSessionSuperAdminMiddle,

    getAdminMenuLinks,

    updateInfos,
    updateUser,
    getAUser,
    getAdminUserFromSession,
    getClientUserFromSession,
    getUsers,
    getUsersLight,
    deleteUser,

    getHomeStats
}
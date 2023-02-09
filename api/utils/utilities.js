import jwt from "jsonwebtoken";
import crypto from "crypto";

// Vérifie la session sous plusieurs conditions
const isSessionValid = async (params = {}, roleNeeded = 'superadmin') => {
    return new Promise((resolve, reject) => {
        const myRet = {
            isValid: false
        }

        // On vérifie si le token JWT est encore valide
        jwt.verify(params?.session, process.env.SESSION_SECRET, (err, decoded) => {
            // JWT invalide = ERREUR
            if (err) {
                myRet.needLogout = true;
                resolve(myRet);
            } else {
                let adminRoles = [];
                switch (roleNeeded) {
                    case 'client':
                        adminRoles = ['client', 'admin', 'superadmin'];
                        break;
                    case 'admin':
                        adminRoles = ['admin', 'superadmin'];
                        break;
                    case 'superadmin':
                        adminRoles = ['superadmin'];
                        break;
                }

                // Vérifie si les roles contient ceux demandés
                const userRoles = decoded?.user?.roles || [];
                if (adminRoles.some(elt => userRoles.includes(elt))) {
                    myRet.isValid = true;
                    resolve(myRet);
                } else {
                    myRet.noAuth = true;
                    resolve(myRet);
                }
            }
        });
    });
}

// Récupération du compte connecté actuel
const getSessionInfos = async (req = undefined, roleNeeded = 'superadmin') => {
    return new Promise((resolve, reject) => {
        try {
            const myRet = {
                hasError: false,
                errorMsg: ""
            };

            let sessionToCheck = "";
            switch (roleNeeded) {
                case "client":
                    sessionToCheck = req?.session?.client?.session;
                    break;
                default:
                    sessionToCheck = req?.session?.admin?.session;
                    break;
            }

            // token manquant
            if (!sessionToCheck) {
                myRet.hasError = true;
                myRet.errorMsg = "Session invalide.";
                resolve(myRet);
            }

            resolve(
                jwt.verify(sessionToCheck, process.env.SESSION_SECRET)?.user
            );
        } catch(err) {
            myRet.hasError = true;
            myRet.errorMsg = "Ciblage impossible.";
            resolve(myRet);
        }
    });
}

// Procède à un chiffrement de données 
const encryptElement = (eltToEncrypt) => {
    return new Promise((resolve, reject) => {
        const cipher = crypto.createCipher('aes-256-ctr', process.env.CRYPTID_SECRET);
        let encryptedStr = cipher.update(eltToEncrypt, 'utf8', 'hex')
        encryptedStr += cipher.final('hex');
        resolve(encryptedStr);
    });
}

// Procède à un déchiffrement de données 
const decryptElement = (eltToDecrypt) => {
    return new Promise((resolve, reject) => {
        const decipher = crypto.createDecipher('aes-256-ctr', process.env.CRYPTID_SECRET);
        let decryptedStr = decipher.update(eltToDecrypt, 'hex', 'utf8');
        decryptedStr += decipher.final('utf8');
        resolve(decryptedStr);
    });
};

export {
    isSessionValid,
    getSessionInfos,

    encryptElement,
    decryptElement
}
import express from "express";

// Imports des actions GET / POST depuis les controlleurs
import { 
    registerUser, getUsers, updateInfos, deleteUser, updateUser, getAUser, getUsersLight, validateUser,
    checkSession, checkSessionMiddle, checkSessionSuperAdminMiddle, checkSessionAdminMiddle,
    getAdminUserFromSession, getClientUserFromSession,
    loginUser, logoutUser,
    getAdminMenuLinks, getHomeStats
} from "../controllers/user.js";
import { addCompany, canManageCompanyMiddle, deleteCompany, getACompany, getCompaniesForAdmin, getCompaniesLight, getCompanyHours, isCompanyHourValidMdw, updateCompany } from "../controllers/company.js";
import { addEvent, cancelEvent, changeStatus, confirmEvent, getConfirmedEvent, getEventsFromCompany, getEventsFromSession } from "../controllers/event.js";

// Routeur pour gérer l'URL
const router = express.Router();

// Gestion de la session
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/check-session", checkSession);
router.post("/menu-links", getAdminMenuLinks);

// Accueil
router.post("/home-stats", checkSessionAdminMiddle, getHomeStats);

// Gestion des entreprises
router.get("/company/list/simple", getCompaniesLight);
router.post("/company/list", checkSessionAdminMiddle, getCompaniesForAdmin);
router.post("/company/get", checkSessionAdminMiddle, getACompany);
router.post("/company/add", checkSessionSuperAdminMiddle, addCompany);
router.post("/company/update", canManageCompanyMiddle, updateCompany);
router.post("/company/delete", checkSessionSuperAdminMiddle, deleteCompany);
router.post("/company/hours", getCompanyHours);

// Gestion des rendez-vous pris sur l'espace de commande (avec quelques tests réalisés en back)
router.post("/event/list", checkSessionAdminMiddle, getEventsFromCompany);
router.post("/event/session/get", checkSessionMiddle, getEventsFromSession);
router.post("/event/add", isCompanyHourValidMdw, addEvent);
router.get("/event/confirmed/get", getConfirmedEvent);
router.post("/event/update-status", changeStatus);
router.post("/event/confirm-event", confirmEvent);
router.post("/event/cancel-event", cancelEvent);

// Gestion de son propre utilisateur
router.get("/profile/client/get", getClientUserFromSession);
router.get("/profile/admin/get", checkSessionAdminMiddle, getAdminUserFromSession);
router.post("/profile/update", checkSessionAdminMiddle, updateInfos);

// Gestion des utilisateurs
router.post("/user/list", checkSessionSuperAdminMiddle, getUsers);
router.post("/user/get", checkSessionSuperAdminMiddle, getAUser);
router.get("/user/list/simple", checkSessionSuperAdminMiddle, getUsersLight);
router.post("/user/add", checkSessionSuperAdminMiddle, registerUser);
router.post("/user/update", checkSessionSuperAdminMiddle, updateUser);
router.post("/user/delete", checkSessionSuperAdminMiddle, deleteUser);
router.post("/user/register", registerUser);
router.post("/user/confirm", validateUser);

export default router;
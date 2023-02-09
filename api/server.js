import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import rateLimit from "express-rate-limit";

import router from './routes/agenda.js';

dotenv.config();

const app = express();

// Gestion du CORS généré par le serveur front / back
app.use(cors());

// Application d'une limite dans l'envoi de requêtes par un utilisateur
const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // Temps d'exécution
	max: 300, // Nombre de requête max possible en simultané
	message: "Une erreur est survenue, veuillez, réessayer plus tard."
});
app.use(limiter);

// Gestion des données JSON envoyées par formulaire
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session actuelle
app.use(session({
    secret: process.env.SESSION_SECRET,
	admin: { isLogged: false },
	client: { isLogged: false },
	resave: false,
	saveUninitialized: true,
	cookie: {maxAge: 3600000}
}));

// Lien vers les routes
app.use('/', router);

// Redirection 404 = quand aucune page n'est trouvée
app.use((req, res) => {
    return res.send('');
});

// Création du serveur
app.listen(process.env.NUM_PORT, () => {
    console.log(`Serveur initialisé au port ${process.env.NUM_PORT}`);
});
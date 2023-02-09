
# OKKI DOKI

Projet de validation pour la formation Développeur Full Stack Javascript / NodeJS / React.


## Fonctionnement général du projet

Pour ce projet, un gestionnaire de rendez-vous pour des entreprise a été réalisé avec une partie front / back.

Plusieurs types de comptes existe:
- "Super Admin" sur le back-office, qui crée les entreprises, les comptes "Admin", et les intègre à la gestion des entreprises créées;
- "Admin" sur le back-office, pouvant gérer les rendez-vous pris sur le site, et modifier les informations d'entreprise (si renseigné comme utilisateur principal);
- Client sur le front-office, utilisé par quelqu'un voulant prendre rendez-vous pour un horaire donné, et renseigner rapidement ses informations. Un historique de rendez-vous est aussi disponible

Il est à noter que les comptes clients sont optionnels, mais chaque information est à renseigner, et que la seule trace client de la prise de rendez-vous, sera le mail envoyé.

## Comment fonctionne le prise de rendez-vous ?

1) CÔTÉ ADMIN: L'entreprise modifie ses horaires de disponibilité et la durée des rendez-vous;
2) CÔTÉ CLIENT: Le client côté front-office, choisit l'entreprise en question et sa semaine;
3) Dès lors, la liste des horaires se met à jour. On peut donc sélectionner sa date adéquate;
4) On renseigne les informations de contact / On se connecte à un compte client;
5) On peut valider la demande 
6) CÔTÉ ADMIN: Une fois le rendez-vous créé et envoyé par mail, l'entreprise peut valider ou annuler le rendez-vous
7) Si le rendez-vous a eu lieu: l'admin de l'entreprise peut mettre à jour le statut du rendez-vous.


## Structuration des dossiers
- Le back et front office en React sont présent dans le dossier "site", et possède différentes pages dans "components > admin" ou  "components > client"
- le dossier "api" correspond à la partie traitement de la base de données, en NodeJS.

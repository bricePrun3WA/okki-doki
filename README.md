
# OKKI DOKI

Projet de validation pour la formation Développeur Full Stack Javascript / NodeJS / React.


## Fonctionnement général du projet

Pour ce projet, un gestionnaire de rendez-vous d'entreprises, a été réalisé avec une partie front / back-office.

Plusieurs types de comptes existent:
- "Super Admin" sur le back-office, qui crée les entreprises, les comptes "Admin", et les intègre à la gestion des entreprises créées;
- "Admin" sur le back-office, pouvant gérer les rendez-vous pris sur le site par des clients, et modifier les informations d'entreprise (si renseigné comme utilisateur principal de l'entreprise modifiée);
- Client sur le front-office, utilisé par quelqu'un voulant prendre rendez-vous pour un horaire donné, et renseigner rapidement ses informations. Un historique de rendez-vous est aussi disponible

Il est à noter que les comptes clients sont optionnels, mais chaque information sera à renseigner si non connecté, et que la seule trace client de cette prise de rendez-vous, sera le mail envoyé de cette demande.

## Comment fonctionne la prise de rendez-vous ?

1) CÔTÉ ADMIN: L'entreprise modifie ses horaires de disponibilité et la durée des rendez-vous;
2) CÔTÉ CLIENT: Le client côté front-office, accède à la page "Prendre rendez-vous", pour choisir l'entreprise en question et sa semaine;
3) Dès lors, la liste des horaires se met à jour sur la page. On peut donc sélectionner sa date adéquate;
4) On renseigne les informations de contact, ou on se connecte à un compte client si ce n'est pas fait;
5) On peut valider la demande, ce qui envoie un mail à l'adresse renseignée
6) CÔTÉ ADMIN: Une fois le rendez-vous créé, l'entreprise peut valider ou annuler le rendez-vous
7) Si le rendez-vous a eu lieu: un admin de l'entreprise peut mettre à jour le statut du rendez-vous.

## Structuration des dossiers
- Le back et front-office en React sont présents dans le dossier "site", et possède différentes pages dans "components > admin" ou  "components > client"
- le dossier "api" correspond à la partie traitement de la base de données, en NodeJS.

## Accès aux pages et accès à l'admin
- L'accès à l'URL "/" mène à l'espace client, tandis que l'URL "/admin" (à taper manuellement) mène à l'epace admin
- Les identifiants super admin: brice.prunier@3wa.io / 123

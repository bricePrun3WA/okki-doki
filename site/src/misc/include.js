// Libellés de Statut de RDV 
const statusListStr = [
    {label: "En attente de confirmation", value: "notConf"},
    {label: "En attente de paiement", value: "tbp"},
    {label: "Payé", value: "p"},
    {label: "Annulé", value: "c"}
];

// Options présentes en select des statuts de RDV
const statusList = [
    {label: "Tous", value: ""},
    {label: "En attente de paiement", value: "tbp"},
    {label: "Payé", value: "p"},
    {label: "Annulé", value: "c"}
];

// Jours de la semaine
const dayOptions = [
    {
        label: "Lundi",
        value: "1"
    },
    {
        label: "Mardi",
        value: "2"
    },
    {
        label: "Mercredi",
        value: "3"
    },
    {
        label: "Jeudi",
        value: "4"
    },
    {
        label: "Vendredi",
        value: "5"
    },
    {
        label: "Samedi",
        value: "6"
    },
    {
        label: "Dimanche",
        value: "0"
    }
];

export {
    statusListStr,
    statusList,

    dayOptions
}
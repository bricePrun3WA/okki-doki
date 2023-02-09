import mongoose from "mongoose";

//mongoose.connect("mongodb://127.0.0.1:27017/okkidoki");
mongoose.connect("mongodb+srv://brice:97o54VRoxbj4@cluster0.ytgx9ha.mongodb.net/okkidoki");

// Modèle d'une entreprise en BDD
let companySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 255
    },
    email: {
        type: String,
        required: true,
        maxlength: 255
    },
    phone: {
        type: String,
        required: true,
        maxlength: 64
    },
    adresse: {
        address: {
            type: String,
            required: true,
            maxlength: 255
        },
        suburb: {
            type: String,
            maxlength: 255
        },
        cp: {
            type: String,
            required: true
        }, 
        city: {
            type: String,
            required: true,
            maxlength: 255
        },
        country: {
            type: String,
            required: true,
            maxlength: 255
        }
    },

    mainUser: { type: mongoose.Types.ObjectId, ref: 'User' },
    users: [{ type: mongoose.Types.ObjectId, ref: 'User' }],

    horaires: [{
        days: [{
            type: Number
        }],
        hourStart: {
            type: String,
            maxlength: 5
        },
        hourEnd: {
            type: String,
            maxlength: 5
        }
    }],
    lengthEvent: Number,
    multipleEvents: Boolean,
    
    dateCreated: Date,
    dateUpdated: Date
});
let Company = mongoose.model("Company", companySchema);

export default Company;
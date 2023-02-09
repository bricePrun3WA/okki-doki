import mongoose from "mongoose";

//mongoose.connect("mongodb://127.0.0.1:27017/okkidoki");
mongoose.connect("mongodb+srv://brice:97o54VRoxbj4@cluster0.ytgx9ha.mongodb.net/okkidoki");

// Modèle d'un utilisateur en BDD
let userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 255
    },
    surname: {
        type: String,
        required: true,
        maxlength: 255
    },
    birthDate: {
        type: Date,
        required: true,
        maxlength: 64
    },
    phone: {
        type: String,
        required: true,
        maxlength: 64
    },
    email: {
        type: String,
        required: true,
        maxlength: 64
    },
    pwd: {
        type: String,
        required: true,
        maxlength: 255
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
    isVerified: Boolean,
    roles: [{
        type: String,
        required: true,
        maxlength: 64
    }],
    dateCreated: Date,
    dateUpdated: Date
});
let User = mongoose.model("User", userSchema);

export default User;
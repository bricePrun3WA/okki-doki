import mongoose from "mongoose";

//mongoose.connect("mongodb://127.0.0.1:27017/okkidoki");
mongoose.connect("mongodb+srv://brice:97o54VRoxbj4@cluster0.ytgx9ha.mongodb.net/okkidoki");

// Modèle d'un RDV en BDD
let eventSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        maxlength: 255
    },
    messages: [{
        msg: {
            type: String,
            required: true,
            maxlength: 500
        },
        user: { type: mongoose.Types.ObjectId, ref: 'User' },
        date: Date
    }],
    startDate: Date,
    endDate: Date,
    status: {
        type: String,
        required: true,
        maxlength: 64
    },
    user: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    userInfos: {
        type: mongoose.Schema({
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
            email: {
                type: String,
                required: true,
                maxlength: 64
            },
            phone: {
                type: String,
                required: true,
                maxlength: 64
            }
        }),
        required: false
    },
    company: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Company'
    },
    confirmed: { type: Boolean, default: false },
    dateCreated: Date,
    dateUpdated: Date
});

let Event = mongoose.model("Event", eventSchema);

export default Event;
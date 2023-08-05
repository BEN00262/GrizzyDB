import mongoose from 'mongoose';

const apikeySchema = new mongoose.Schema({
    apikey: {
        type: String,
        required: true,
        unique: true
    },

    owner: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    }
}, { timestamps: true });


export const ApiKeyModel = mongoose.model('apikey', apikeySchema);

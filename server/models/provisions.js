import mongoose from 'mongoose';

const databaseProvisionSchema = new mongoose.Schema({
    dialect: {
        type: String,
        enum: ['postgres', 'mysql', 'mariadb'],
        required: true
    },

    enabled: {
        type: Boolean,
        default: false
    },

    // enforced using yup on the client side
    logo: {
        type: String,
        required: true
    }
}, { timestamps: true });


export const DatabaseProvisionModel = mongoose.model('provision', databaseProvisionSchema);

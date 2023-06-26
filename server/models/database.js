import mongoose from 'mongoose';

const databaseSchema = new mongoose.Schema({
    dialect: {
        type: String,
        enum: ['postgres', 'mysql', 'mariadb'],
        required: true
    },

    name: {
        type: String,
        required: true
    },

    // enforced using yup on the client side
    credentials: {
        type: String,
        unique: true,
        required: true
    },

    rest_script: {
        type: String
    },

    graphql_script: {
        type: String
    },

    owner: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });


export const DatabaseModel = mongoose.model('Database', databaseSchema);

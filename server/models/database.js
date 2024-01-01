import mongoose from 'mongoose';

const databaseSchema = new mongoose.Schema({
    dialect: {
        type: String,
        enum: ['postgres', 'mysql', 'mariadb', 'chromadb', 'rethinkdb', 'sqllite'],
        required: true
    },

    name: {
        type: String,
        required: true
    },

    // type -- can be a hosted database
    // or a you
    product_type: {
        type: String,
        enum: ['hosted', 'bring_your_own', 'connected'],
        default: 'hosted'
    },

    // enforced using yup on the client side
    credentials: {
        type: String,
    },

    // DEPRACTED ... maybe
    rest_script: {
        type: String
    },

    // DEPRACTED ... maybe
    graphql_script: {
        type: String
    },

    folder: {
        type: mongoose.Types.ObjectId,
        ref: 'folder'
    },

    owner: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });


export const DatabaseModel = mongoose.model('Database', databaseSchema);

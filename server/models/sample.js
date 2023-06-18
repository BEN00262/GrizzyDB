import mongoose from 'mongoose';

const sampleSchema = new mongoose.Schema({
    dialect: {
        type: String,
        enum: ['postgres', 'mysql', 'mariadb'],
        required: true
    },

    name: {
        type: String,
        unique: true,
        required: true
    },

    // enforced using yup on the client side
    sql_statements: {
        type: String,
        required: true
    }
}, { timestamps: true });


export const SampleModel = mongoose.model('sample', sampleSchema);
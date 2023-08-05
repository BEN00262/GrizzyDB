import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // comes from google
    email: {
        type: String,
        unique: true,
        required: true
    }
}, { timestamps: true });


export const UserModel = mongoose.model('user', userSchema);

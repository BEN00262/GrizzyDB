import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // comes from google
    user_reference: {
        type: String,
        unique: true,
        required: true
    }
}, { timestamps: true });


export const UserModel = mongoose.model('user', userSchema);

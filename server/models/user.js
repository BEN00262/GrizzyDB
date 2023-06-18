import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    user_fingerprint: {
        type: String,
        unique: true,
        required: true
    }
}, { timestamps: true });


export const UserModel = mongoose.model('user', userSchema);

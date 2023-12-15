import mongoose from 'mongoose';

const favouriteSchema = new mongoose.Schema({
    position: {
        type: Number,
        default: 0
    },

    
    database: {
        type: mongoose.Types.ObjectId,
        ref: 'Database'
    },
    

    owner: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });


export const QuickAccessModel = mongoose.model('quick_access', favouriteSchema);

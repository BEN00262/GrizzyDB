import mongoose from 'mongoose';

// have multiple versions of this
// should we also encry the snapshots ??
const subscriptionSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },

    reference: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ['paid', 'pending'],
        default: 'pending'
    },

    endTime: {
        type: Date,
        required: true
    }
}, { timestamps: true });


export const SubscriptionModel = mongoose.model('subscription', subscriptionSchema);

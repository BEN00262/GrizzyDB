import mongoose from 'mongoose';

const pricingSchema = new mongoose.Schema({
    enabled: {
        type: Boolean,
        default: false
    },

    // lemon squeezy variant ids (monthly)
    variantID: {
        type: Number,
        required: true
    },

    yVariantID: {
        type: Number,
        required: true
    },

    caption: {
        type: String,
        required: true
    },

    // a list of features per item
    features: [
        {
            type: String,
            required: true
        }
    ]
}, { timestamps: true });


export const PricingModel = mongoose.model('pricing', pricingSchema);

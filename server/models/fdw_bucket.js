import mongoose from 'mongoose';

const fdwBucketSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    parent_node: {
        type: mongoose.Types.ObjectId,
        ref: 'Database'
    },

    // fdw child nodes
    child_nodes: [{
        type: mongoose.Types.ObjectId,
        ref: 'Database'
    }],

    folder: {
        type: mongoose.Types.ObjectId,
        ref: 'folder'
    },

    owner: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });


export const FDWBucketModel = mongoose.model('FDWBucket', fdwBucketSchema);

import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    parent: {
        type: mongoose.Types.ObjectId,
        ref: 'folder'
    },

    owner: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });


export const FolderModel = mongoose.model('folder', folderSchema);

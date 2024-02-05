import mongoose from 'mongoose';

// have multiple versions of this
// should we also encry the snapshots ??
// add configs

const snippetSchema = new mongoose.Schema({
    snippet: {
        type: String,
        required: true
    },

    // users are able to rename their snapshots
    // if not available use a segment of the snippet as the name of the snippet
    name: {
        type: String,
    },

    database: {
        type: mongoose.Types.ObjectId,
        ref: 'Database'
    },

    owner: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    }
}, { timestamps: true });


export const SnippetModel = mongoose.model('snippet', snippetSchema);

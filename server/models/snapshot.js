import mongoose from 'mongoose';

// have multiple versions of this
// should we also encry the snapshots ??
const snapshotSchema = new mongoose.Schema({
    snapshot: {
        type: String,
        required: true
    },

    // md5 hash of the snapshot
    // can be null for the genesis block
    checksum: {
        type: String,
    },

    // useful for when we store your data
    url_to_dump: {
        type: String,
    },

    status: {
        type: String,
        enum: ['scheduled', 'generating', 'done', 'failed'],
        default: 'done'
    },

    // only relevant incase the status is marked as being failed
    failure_reason: {
        type: String
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


export const SnapshotModel = mongoose.model('snapshot', snapshotSchema);

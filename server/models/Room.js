const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Agent' }],
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
        content: String,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    lastUpdated: { type: Date, default: Date.now }
});

RoomSchema.index({ participants: 1 });

module.exports = mongoose.model('Room', RoomSchema);

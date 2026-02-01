const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    content: { type: String, required: true },
    likesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);

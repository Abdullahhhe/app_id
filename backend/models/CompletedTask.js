const mongoose = require('mongoose');
const CompletedTaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    task: { type: String, required: true },
    proofImage: { type: String, default: null },
    status: { type: String, enum: ['معلق', 'مقبول', 'مرفوض'], default: 'معلق' },
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('CompletedTask', CompletedTaskSchema);

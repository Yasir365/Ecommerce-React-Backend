const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    createdDate: {
        type: Date,
        default: Date.now
    },
    deadline: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in progress', 'completed', 'missed'],
        default: 'pending'
    }
});

const Tickets = mongoose.model('Tickets', todoSchema);

module.exports = Tickets;

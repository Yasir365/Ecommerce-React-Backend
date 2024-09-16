const Tickets = require('../models/tickets.model');
const verifySchema = require('../validators/validate');
const schema = require('../validators/schema.json');

const list = async (req, res) => {
    try {
        const tickets = await Tickets.find({ userId: req.user.id });

        if (tickets.length > 0) {
            res.status(200).json({ success: true, data: tickets });
        } else {
            res.status(200).json({ success: true, data: [] });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch tickets', error: error.message });
    }
};



const add = async (req, res) => {
    const verifyReq = verifySchema(schema.addTicket, req.body);
    if (!verifyReq.success) {
        return res.status(400).send(verifyReq.message);
    }

    const { title, description, deadline } = req.body;
    const userId = req.user.id;
    try {
        const newTicket = new Tickets({
            title,
            description,
            deadline,
            userId
        });

        const savedTicket = await newTicket.save();

        res.status(201).json({
            message: 'Ticket added successfully',
            ticket: savedTicket,
            success: true
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add Ticket', error: error.message });
    }
};



const edit = async (req, res) => {
    const verifyReq = verifySchema(schema.editTicket, req.body);
    if (!verifyReq.success) {
        return res.status(400).send(verifyReq.message);
    }

    const id = req.query.id;
    const updateFields = req.body;

    try {
        // Check if the ticket exists
        const existingTicket = await Tickets.findById(id);
        if (!existingTicket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        Object.keys(updateFields).forEach(field => {
            existingTicket[field] = updateFields[field];
        });

        const updatedTicket = await existingTicket.save();

        res.status(200).json({
            message: 'Ticket updated successfully',
            ticket: updatedTicket,
            success: true
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update ticket', error: error.message });
    }
};



const remove = async (req, res) => {
    const userId = req.user.id;
    const ticketId = req.query.id;

    if (!ticketId) {
        return res.status(404).json({ message: 'Ticket not found' });
    }

    try {
        // Check if the ticket exists
        const existingTicket = await Tickets.findById(ticketId);
        if (!existingTicket || existingTicket.userId != userId) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Delete the ticket
        await Tickets.findByIdAndDelete(ticketId);

        res.status(200).json({
            message: 'Ticket deleted successfully',
            success: true
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete ticket', error: error.message });
    };

}


module.exports = { list, add, edit, remove };

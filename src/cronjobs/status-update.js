const cron = require('node-cron');
const Tickets = require('../models/tickets.model');


cron.schedule('0 * * * * ', async () => {
    try {
        const expiredTickets = await Tickets.find({
            status: 'pending',
            deadline: { $lt: new Date() }
        });

        // Update the status of expired tickets to 'missed'
        for (const ticket of expiredTickets) {
            ticket.status = 'missed';
            await ticket.save();
        }

        console.log('Cron job executed successfully.');
    } catch (error) {
        console.error('Error in executing cron job:', error);
    }
});

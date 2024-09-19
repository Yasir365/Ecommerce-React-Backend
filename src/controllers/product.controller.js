const verifySchema = require('../validators/validate');
const schema = require('../validators/schema.json');
const Product = require('../models/product.model');

const list = async (req, res) => {
    const currentPage = parseInt(req.query.currentPage) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    const keyword = req.query.search || '';

    try {
        const query = {};
        if (keyword) {
            query.title = { $regex: keyword, $options: 'i' };
        }

        const products = await Product.find(query)
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);

        const totalCount = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                currentPage,
                itemsPerPage,
                totalCount,
                totalPages: Math.ceil(totalCount / itemsPerPage),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Products',
            error: error.message,
        });
    }
};


const add = async (req, res) => {
    const { title, description, price } = req.body;

    // Check if image is uploaded
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Image is required' });
    }

    try {
        const newProduct = new Product({
            title,
            description,
            price,
            image: req.file.path // Use file path for the image field
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({
            message: 'Product added successfully',
            data: savedProduct,
            success: true
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add product', error: error.message });
    }
};




const edit = async (req, res) => {
    // const verifyReq = verifySchema(schema.editTicket, req.body);
    // if (!verifyReq.success) {
    //     return res.status(400).send(verifyReq.message);
    // }

    // const id = req.query.id;
    // const updateFields = req.body;

    // try {
    //     // Check if the ticket exists
    //     const existingTicket = await Tickets.findById(id);
    //     if (!existingTicket) {
    //         return res.status(404).json({ message: 'Ticket not found' });
    //     }

    //     Object.keys(updateFields).forEach(field => {
    //         existingTicket[field] = updateFields[field];
    //     });

    //     const updatedTicket = await existingTicket.save();

    //     res.status(200).json({
    //         message: 'Ticket updated successfully',
    //         ticket: updatedTicket,
    //         success: true
    //     });
    // } catch (error) {
    //     res.status(500).json({ message: 'Failed to update ticket', error: error.message });
    // }
};



const remove = async (req, res) => {
    // const userId = req.user.id;
    // const ticketId = req.query.id;

    // if (!ticketId) {
    //     return res.status(404).json({ message: 'Ticket not found' });
    // }

    // try {
    //     // Check if the ticket exists
    //     const existingTicket = await Tickets.findById(ticketId);
    //     if (!existingTicket || existingTicket.userId != userId) {
    //         return res.status(404).json({ message: 'Ticket not found' });
    //     }

    //     // Delete the ticket
    //     await Tickets.findByIdAndDelete(ticketId);

    //     res.status(200).json({
    //         message: 'Ticket deleted successfully',
    //         success: true
    //     });
    // } catch (error) {
    //     res.status(500).json({ message: 'Failed to delete ticket', error: error.message });
    // };

}


module.exports = { list, add, edit, remove };

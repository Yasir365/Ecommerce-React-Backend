const verifySchema = require('../validators/validate');
const schema = require('../validators/schema.json');
const Product = require('../models/product.model');

const productList = async (req, res) => {
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


const addProduct = async (req, res) => {
    const verifyReq = verifySchema(schema.addProduct, req.body);
    if (!verifyReq.success) {
        return res.status(400).send(verifyReq.message);
    }
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


const editProduct = async (req, res) => {
    const verifyReq = verifySchema(schema.editProduct, req.body);
    if (!verifyReq.success) {
        return res.status(400).send(verifyReq.message);
    }
    const { productId,title, description, price } = req.body;

    try {
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update fields
        if (title) existingProduct.title = title;
        if (description) existingProduct.description = description;
        if (price) existingProduct.price = price;

        // Check if image is uploaded
        if (req.file) {
            existingProduct.image = req.file.path; // Use new file path for the image field
        }

        // Save updated product
        const updatedProduct = await existingProduct.save();

        res.status(200).json({
            message: 'Product updated successfully',
            data: updatedProduct,
            success: true
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
    }
};


const deleteProduct = async (req, res) => {
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


module.exports = { productList, addProduct, editProduct, deleteProduct };

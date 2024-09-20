const verifySchema = require('../validators/validate');
const schema = require('../validators/schema.json');
const Product = require('../models/product.model');
const fs = require('fs');
const path = require('path');
const { default: mongoose } = require('mongoose');


const productList = async (req, res) => {
    const currentPage = parseInt(req.body.currentPage);
    const itemsPerPage = parseInt(req.body.itemsPerPage);
    const keyword = req.body.search;
    const productId = req.body.productId;

    try {
        const matchStage = {};

        if (productId) {
            matchStage._id = new mongoose.Types.ObjectId(productId);
        } else if (keyword) {
            matchStage.title = { $regex: keyword, $options: 'i' };
        }

        const pipeline = [];

        if (Object.keys(matchStage).length) {
            pipeline.push({ $match: matchStage });
        }

        if (currentPage && itemsPerPage) {
            pipeline.push({ $skip: (currentPage - 1) * itemsPerPage });
            pipeline.push({ $limit: itemsPerPage });
        }

        const countPipeline = [];
        if (Object.keys(matchStage).length) {
            countPipeline.push({ $match: matchStage });
        }
        countPipeline.push({ $count: 'totalCount' });

        const [products, [{ totalCount } = { totalCount: 0 }]] = await Promise.all([
            Product.aggregate(pipeline),
            Product.aggregate(countPipeline),
        ]);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                totalCount: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / itemsPerPage),
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
    const { productId, title, description, price } = req.body;

    try {
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Store the old image path
        const oldImagePath = existingProduct.image;

        // Update fields
        if (title) existingProduct.title = title;
        if (description) existingProduct.description = description;
        if (price) existingProduct.price = price;

        // Check if a new image is uploaded
        if (req.file) {
            existingProduct.image = req.file.path; // Use new file path for the image field

            // Delete the old image file
            if (oldImagePath) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.error('Failed to delete old image:', err);
                    }
                });
            }
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
    const verifyReq = verifySchema(schema.deleteProduct, req.query);
    if (!verifyReq.success) {
        return res.status(400).send(verifyReq.message);
    }
    const { productId } = req.query;

    try {
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Store the image path to delete it later
        const imagePath = existingProduct.image;

        // Delete the product from the database
        await Product.deleteOne({ _id: productId });

        // Delete the image file from the filesystem
        if (imagePath) {
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Failed to delete image:', err);
                }
            });
        }

        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
    }
};


module.exports = { productList, addProduct, editProduct, deleteProduct };

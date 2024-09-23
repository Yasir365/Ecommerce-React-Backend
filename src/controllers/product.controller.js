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
    const { title, description, price } = req.body;

    // Check if thumbnail is uploaded
    if (!req.files['thumbnail']) {
        return res.status(400).json({ success: false, message: 'Thumbnail is required' });
    }

    // Check if at least one additional image is uploaded
    if (!req.files['images'] || req.files['images'].length === 0) {
        return res.status(400).json({ success: false, message: 'At least one additional image is required' });
    }

    try {
        // Save file paths
        const thumbnailPath = req.files['thumbnail'][0].path;
        const imagesPaths = req.files['images'].map(file => file.path);

        const newProduct = new Product({
            title,
            description,
            price,
            thumbnail: thumbnailPath, // Save thumbnail path
            images: imagesPaths // Save additional images paths
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
    const { productId } = req.body;
    const { title, description, price } = req.body;

    try {
        const updateData = { title, description, price };

        // Check if a new thumbnail is uploaded
        if (req.files['thumbnail'] && req.files['thumbnail'].length > 0) {
            updateData.thumbnail = req.files['thumbnail'][0].path;
        }

        // Check if new images are uploaded
        if (req.files['images']) {
            updateData.images = req.files['images'].map(file => file.path);
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

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
    const { productId } = req.query;

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Remove image files from the filesystem
        if (product.thumbnail) {
            fs.unlink(path.join('upload', '..', product.thumbnail), (err) => {
                if (err) console.error(`Failed to delete thumbnail: ${err}`);
            });
        }
        if (product.images && product.images.length > 0) {
            product.images.forEach(image => {
                fs.unlink(path.join('upload', '..', image), (err) => {
                    if (err) console.error(`Failed to delete image: ${err}`);
                });
            });
        }

        await Product.findByIdAndDelete(productId);

        res.status(200).json({
            message: 'Product deleted successfully',
            success: true
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
    }
};

module.exports = { productList, addProduct, editProduct, deleteProduct };

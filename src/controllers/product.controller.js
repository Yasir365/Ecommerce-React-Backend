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
    if (!req.files['image1'] || !req.files['image2'] || !req.files['image3']) {
        return res.status(400).json({ success: false, message: 'Three additional images are required' });
    }

    try {
        // Save file paths
        const thumbnailPath = req.files['thumbnail'][0].path;

        const newProduct = new Product({
            title,
            description,
            price,
            thumbnail: thumbnailPath,
            images: [
                { image1: req.files['image1'][0].filename },
                { image2: req.files['image2'][0].filename },
                { image3: req.files['image3'][0].filename },
            ],
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
        // Find the existing product
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const updateData = { title, description, price };

        // Check if a new thumbnail is uploaded
        if (req.files['thumbnail'] && req.files['thumbnail'].length > 0) {
            updateData.thumbnail = req.files['thumbnail'][0].filename; // Update thumbnail
        }

        // Check if new images are uploaded
        if (req.files['image1'] || req.files['image2'] || req.files['image3']) {
            const images = [...existingProduct.images]; // Start with existing images

            // Update specific image slots as needed
            if (req.files['image1']) images[0] = { image1: req.files['image1'][0].filename };
            if (req.files['image2']) images[1] = { image2: req.files['image2'][0].filename };
            if (req.files['image3']) images[2] = { image3: req.files['image3'][0].filename };

            updateData.images = images;
        }

        // Update the product with the new data
        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });

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
            fs.unlink(path.join('uploads', product.thumbnail), (err) => {
                if (err) console.error(`Failed to delete thumbnail: ${err}`);
            });
        }
        if (product.images && product.images.length > 0) {
            product.images.forEach(image => {
                const imageName = Object.values(image)[0]; // Get the image filename
                fs.unlink(path.join('uploads', imageName), (err) => {
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

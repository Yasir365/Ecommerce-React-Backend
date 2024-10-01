const verifySchema = require('../validators/validate');
const schema = require('../validators/schema.json');
const Product = require('../models/product.model');
const fs = require('fs');
const path = require('path');
const { default: mongoose } = require('mongoose');
const { cloudinary } = require('../middlewares/cloudinary.config'); // Import cloudinary


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

    if (!req.files['thumbnail']) {
        return res.status(400).json({ success: false, message: 'Thumbnail is required' });
    }

    if (!req.files['image1'] || !req.files['image2'] || !req.files['image3'] || !req.files['image4']) {
        return res.status(400).json({ success: false, message: 'Three additional images are required' });
    }

    try {
        const newProduct = new Product({
            title,
            description,
            price,
            thumbnail: req.files['thumbnail'][0],
            images: [
                req.files['image1'][0],
                req.files['image2'][0],
                req.files['image3'][0],
                req.files['image4'][0],
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
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const updateData = { title, description, price };

        // Handle thumbnail update
        if (req.files['thumbnail'] && req.files['thumbnail'].length > 0) {
            // Delete old thumbnail from Cloudinary
            if (existingProduct.thumbnail) {
                const publicId = existingProduct.thumbnail.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId); // Deletes the image from Cloudinary
            }
            updateData.thumbnail = req.files['thumbnail'][0].path;  // New Cloudinary thumbnail URL
        }

        // Handle additional images update
        if (req.files['image1'] || req.files['image2'] || req.files['image3'] || req.files['image4']) {
            const images = [];

            // Delete old images from Cloudinary
            for (const image of existingProduct.images) {
                for (const value of Object.values(image)) {
                    if (typeof value === 'string') {
                        const publicId = value.split('/').pop().split('.')[0];
                        await cloudinary.uploader.destroy(publicId); // Deletes the image from Cloudinary
                    }
                }
            }

            // Update new images
            if (req.files['image1']) images.push({ image1: req.files['image1'][0].path });
            if (req.files['image2']) images.push({ image2: req.files['image2'][0].path });
            if (req.files['image3']) images.push({ image3: req.files['image3'][0].path });
            if (req.files['image4']) images.push({ image4: req.files['image4'][0].path });



            updateData.images = images;
        }

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

        // Delete the thumbnail from Cloudinary
        if (product.thumbnail) {
            const publicId = product.thumbnail.filename;
            let deleteImage = await cloudinary.uploader.destroy(publicId);
            console.log("Thumbnail deleted:", deleteImage);
        }

        if (product.images && product.images.length > 0) {
            for (const image of product.images) {
                const publicId = image.filename;
                const deleteSubImage = await cloudinary.uploader.destroy(publicId);
                console.log("SubImage deleted:", deleteSubImage);
            }
        }

        // Remove product from the database
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

const verifySchema = require('../validators/validate');
const schema = require('../validators/schema.json');
const Product = require('../models/product.model');
const fs = require('fs');
const path = require('path');
const { default: mongoose } = require('mongoose');
const { cloudinary } = require('../config/cloudinary.config'); // Import cloudinary


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

        if (req.files['thumbnail']) {
            if (existingProduct.thumbnail) {
                const publicId = existingProduct.thumbnail.filename;
                const deleteThumbnail = await cloudinary.uploader.destroy(publicId);
                console.log("Thumbnail deleted:", deleteThumbnail);
            }
            updateData.thumbnail = req.files['thumbnail'][0]
        }

        // Update images
        if (req.files['image1'] || req.files['image2'] || req.files['image3'] || req.files['image4']) {
            const images = [...existingProduct.images];

            // Delete and update images
            if (req.files['image1']) {
                if (images[0]) {
                    const publicId = images[0].filename;
                    const deleteImage = await cloudinary.uploader.destroy(publicId);
                    console.log("Image1 deleted:", deleteImage);
                }
                images[0] = req.files['image1'][0];
            }
            if (req.files['image2']) {
                if (images[1]) {
                    const publicId = images[1].filename;
                    const deleteImage = await cloudinary.uploader.destroy(publicId);
                    console.log("Image2 deleted:", deleteImage);
                }
                images[1] = req.files['image2'][0];
            }
            if (req.files['image3']) {
                if (images[2]) {
                    const publicId = images[2].filename;
                    const deleteImage = await cloudinary.uploader.destroy(publicId);
                    console.log("Image3 deleted:", deleteImage);
                }
                images[2] = req.files['image3'][0];
            }
            if (req.files['image4']) {
                if (images[3]) {
                    const publicId = images[3].filename;
                    const deleteImage = await cloudinary.uploader.destroy(publicId);
                    console.log("Image4 deleted:", deleteImage);
                }
                images[3] = req.files['image4'][0];
            }

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

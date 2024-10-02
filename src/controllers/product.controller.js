const verifySchema = require('../validators/validate');
const schema = require('../validators/schema.json');
const Product = require('../models/product.model');
const fs = require('fs');
const path = require('path');
const { default: mongoose } = require('mongoose');
const cloudinary = require('../config/cloudinary.config');
const { v4: uuidv4 } = require('uuid');



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
        return res.status(400).json({ success: false, message: 'Four additional images are required' });
    }

    try {
        const uploadThumbnail = new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'Ecommerce-React-Images',
                    public_id: `thumbnail_${uuidv4()}`,
                },
                (error, result) => {
                    if (error) reject(error);
                    resolve({
                        filename: result.public_id,
                        path: result.secure_url,
                    });
                }
            ).end(req.files['thumbnail'][0].buffer);
        });

        const imageUploads = [];
        for (let i = 1; i <= 4; i++) {
            const imageFile = req.files[`image${i}`][0];
            const uploadPromise = new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: 'Ecommerce-React-Images',
                        public_id: `image${i}_${uuidv4()}`,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve({
                            filename: result.public_id,
                            path: result.secure_url,
                        });
                    }
                ).end(imageFile.buffer);
            });
            imageUploads.push(uploadPromise);
        }
        const results = await Promise.all([uploadThumbnail, ...imageUploads]);
        const thumbnailResult = results[0];
        const imagesResults = results.slice(1);

        const newProduct = new Product({
            title,
            description,
            price,
            thumbnail: thumbnailResult,
            images: imagesResults,
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({
            message: 'Product added successfully',
            data: savedProduct,
            success: true,
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
            if (existingProduct.thumbnail && existingProduct.thumbnail.filename) {
                await cloudinary.uploader.destroy(existingProduct.thumbnail.filename);
            }

            const uploadThumbnail = new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: 'Ecommerce-React-Images',
                        public_id: `thumbnail_${uuidv4()}`,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        resolve({
                            filename: result.public_id,
                            path: result.secure_url,
                        });
                    }
                ).end(req.files['thumbnail'][0].buffer);
            });

            const results = await Promise.all([uploadThumbnail]);
            const thumbnailResult = results[0];

            updateData.thumbnail = thumbnailResult;
        }

        if (req.files['image1'] || req.files['image2'] || req.files['image3'] || req.files['image4']) {
            const images = [...existingProduct.images];

            for (let i = 1; i <= 4; i++) {
                if (req.files[`image${i}`]) {
                    if (images[i - 1] && images[i - 1].filename) {
                        await cloudinary.uploader.destroy(images[i - 1].filename);
                    }

                    const imageResult = await new Promise((resolve, reject) => {
                        cloudinary.uploader.upload_stream(
                            {
                                folder: 'Ecommerce-React-Images',
                                public_id: `image${i}_${uuidv4()}`,
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve({
                                    filename: result.public_id,
                                    path: result.secure_url,
                                });
                            }
                        ).end(req.files[`image${i}`][0].buffer);
                    });

                    images[i - 1] = imageResult;
                }
            }

            updateData.images = images;
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });

        res.status(200).json({
            message: 'Product updated successfully',
            data: updatedProduct,
            success: true,
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

        if (product.thumbnail && product.thumbnail.filename) {
            await cloudinary.uploader.destroy(product.thumbnail.filename);
        }

        if (product.images && product.images.length > 0) {
            for (const image of product.images) {
                if (image && image.filename) {
                    await cloudinary.uploader.destroy(image.filename);
                }
            }
        }

        await Product.findByIdAndDelete(productId);

        res.status(200).json({
            message: 'Product deleted successfully',
            success: true,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
    }
};




module.exports = { productList, addProduct, editProduct, deleteProduct };

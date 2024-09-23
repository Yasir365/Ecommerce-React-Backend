const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    reviews: [
        {
            type: {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
                rating: { type: Number },
                comment: { type: String }
            }
        }
    ],
    thumbnail: {
        type: String,
        required: true
    },
    images: [
        {
            image1: {type: String},
            image2: {type: String},
            image3: {type: String},
        }
    ],
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Products', productSchema);

module.exports = Product;

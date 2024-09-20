
const verifySchema = require('../validators/validate');
const schema = require('../validators/schema.json');
const User = require('../models/user.model');
const { default: mongoose } = require('mongoose');


const list = async (req, res) => {
    const currentPage = parseInt(req.body.currentPage);
    const itemsPerPage = parseInt(req.body.itemsPerPage);
    const keyword = req.body.search;

    try {
        const matchStage = {};

        if (keyword) {
            matchStage.username = { $regex: keyword, $options: 'i' };
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

        const [users, [{ totalCount } = { totalCount: 0 }]] = await Promise.all([
            User.aggregate(pipeline),
            User.aggregate(countPipeline),
        ]);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                totalCount: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / itemsPerPage),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Users',
            error: error.message,
        });
    }
}

const toggleUserStatus = async (req, res) => {
    const { userId } = req.query;

    try {
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        existingUser.status = existingUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const updatedUser = await existingUser.save();

        res.status(200).json({
            success: true,
            message: 'User status updated successfully',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
}


module.exports = {
    list,
    toggleUserStatus
}
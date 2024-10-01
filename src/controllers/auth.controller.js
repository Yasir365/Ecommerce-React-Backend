const User = require('../models/user.model');
const verifySchema = require('../validators/validate');
const schema = require('../validators/schema.json');
const bcrypt = require('bcrypt');
const { generateToken } = require('../middlewares/jwt.middleware');
const nodemailer = require('nodemailer');
require('dotenv').config();
const path = require('path');
const jwt = require('jsonwebtoken');


const register = async (req, res) => {
    const verifyReq = verifySchema(schema.register, req.body);
    if (!verifyReq.success) {
        return res.status(400).send(verifyReq.message);
    }

    const { name, email, phone, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Encrypt the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ name, email, phone, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



const sendEmail = async (email, otp) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });

    let mailOptions = {
        from: `Ecommerce React Team 👻 ${process.env.EMAIL} `,
        to: email,
        subject: 'Verification code',
        html: `
        <div style="font-family: Arial, sans-serif; text-align: center;">
            <img src="cid:logo" alt="Company Logo" style="width: 150px; margin-top: 20px;" />
            <p style="font-size: 1.2em; color: #333;">Your OTP code is:</p>
            <h2 style="font-size: 2em; color: #333; background-color: #f4f4f4; display: inline-block; padding: 10px; border-radius: 5px;">${otp}</h2>
            <p style="font-size: 1em; color: #666; margin-top: 20px;">Please use this OTP code within 60 seconds. If you did not request this code, please ignore this email.</p>
        </div>
        `,
        attachments: [
            {
                filename: 'logo.png',
                path: path.join(__dirname, '../assets/logo.png'),
                cid: 'logo'
            }
        ]
    };

    // Send email
    await transporter.sendMail(mailOptions);
};



const login = async (req, res) => {
    const verifyReq = verifySchema(schema.login, req.body);
    if (!verifyReq.success) {
        return res.status(400).send(verifyReq.message);
    }

    const { email, password } = req.body;
    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ success: false, message: 'Incorrect Email or Password' });
        }

        // Compare hashed passwords
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Incorrect Email or Password' });
        }

        // Generate JWT token
        const userData = {
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            id: user._id
        };

        const token = generateToken(userData)

        return res.status(200).json({
            message: 'Login successful',
            email: user.email,
            token: token,
            role: user.role,
            success: true
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



const verifyOTP = async (req, res) => {
    const verifyReq = verifySchema(schema.verifyEmail, req.body);
    if (!verifyReq.success) {
        return res.status(400).send(verifyReq.message);
    }

    const { email, otp } = req.body;
    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if OTP matches and has not expired
        if (user.otp !== otp || user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Return user data without the password along with the token
        return res.status(200).json({
            message: 'OTP verfication successful',
            success: true
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



const forgetPassword = async (req, res) => {
    const verifyReq = verifySchema(schema.forgetPassword, req.body);
    if (!verifyReq.success) {
        return res.status(400).send(verifyReq.message);
    }

    const { email, otp } = req.body;
    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate OTP and set expiry time
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 60 * 1000);

        // Store the OTP and its expiry in the database
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP email
        await sendEmail(user.email, otp);

        return res.status(200).json({
            message: 'OTP sent to your email',
            email: user.email,
            success: true
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



const resetPassword = async (req, res) => {
    const verifyReq = verifySchema(schema.resetPassword, req.body);
    if (!verifyReq.success) {
        return res.status(400).send(verifyReq.message);
    }

    const { email, password } = req.body;
    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Encrypt the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ message: 'Password reset successful', success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: error.message });
    }
};


const verifyToken = async (req, res) => {
    let token = req.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7); // Remove the 'Bearer ' prefix
    } else {
        return res.status(401).json({ message: 'Unauthorized' });

    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(200).json({ message: 'Invalid token', success: false });
        }
        req.user = decodedToken;
        return res.status(200).json({
            message: 'Token verified',
            success: true,
            role: decodedToken.role,
        });
    });
}



const changePassword = async (req, res) => {
    const verifyReq = verifySchema(schema.changePassword, req.body);
    if (!verifyReq.success) {
        return res.status(400).send(verifyReq.message);
    }

    const email = req.user.email;
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findOne({ email });

        // Check if old password is correct
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(200).json({ message: 'Incorrect old password', success: false });
        }

        // Encrypt the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ message: 'Password changed successfully', success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



module.exports = { login, register, verifyOTP, forgetPassword, resetPassword, verifyToken, changePassword };

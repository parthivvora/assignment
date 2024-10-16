const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require('nodemailer');
const { createUserSchema, updatePasswordSchema, loginUserSchema, emailValidation } = require('../validators/userValidator');

// Create a new user
// exports.createUser = async (req, res) => {
//     try {
//         const { error } = createUserSchema.validate(req.body);
//         if (error) return res.status(400).json({ message: error.details[0].message });

//         const { name, email, password } = req.body;

//         // Check if user already exists
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create the user with `isVerified: false`
//         const newUser = new User({
//             name,
//             email,
//             password: hashedPassword,
//             isVerified: false, // Initially not verified
//         });

//         await newUser.save();

//         res.status(201).json({ message: 'User created! Please verify your email.' });
//     } catch (error) {
//         res.status(500).json({ message: 'Error creating user', error });
//     }
// };



exports.createUser = async (req, res) => {
    try {
        const { error } = createUserSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { name, email, password } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user with `isVerified: false`
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            isVerified: false,
        });

        await newUser.save();

        // Generate the verification token
        const token = jwt.sign(
            { email }, // Store email in the token
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Set expiration for the token
        );



        res.status(201).json({ message: 'User created! Please verify your email.' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
    }
};



exports.verifyDBEmail = async (req, res) => {
    try {
        const { email } = req.body;

        // console.log(email)
        // return;
        const { error } = emailValidation.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        // Find user by email
        const user = await User.findOne({ email });
        const token = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        if (!user.isVerified) {
            const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
            await sendVerificationEmail(email, verificationUrl, 'createUser');
            return res.status(200).json({ message: 'Email sent successfully' });
        } else if (user.isVerified) {
            return res.status(401).json({ message: 'User verified already' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

const sendVerificationEmail = async (email, accessUrl, emailType) => {


    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });
        // console.log("🚀 ~ sendVerificationEmail ~ transporter:", transporter)

        let subject = '';
        let message = '';

        // Customize subject and message based on the email type
        if (emailType === 'createUser') {
            subject = 'Verify your email';
            message = `<p>Please <a href="${accessUrl}">click here</a> to verify your email address.</p>`;
        } else if (emailType === 'updatePassword') {
            subject = 'Reset your password';
            message = `<p>Please <a href="${accessUrl}">click here</a> to reset your password.</p>            `;
        }

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: subject,
            html: message
        };
        // console.log("🚀 ~ sendVerificationEmail ~ mailOptions:", mailOptions)


        const av = await transporter.sendMail(mailOptions);
        //    console.log("🚀 ~ sendVerificationEmail ~ av:", av.response)

        // console.log('Verification email sent');
    } catch (error) {

        console.error('Error sending email', error);
    }
};


// Verify email route
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        console.log(req.query)

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email } = decoded;

        // Update the user to set isVerified to true
        const user = await User.findOneAndUpdate(
            { email },
            { isVerified: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'Email verified successfully!' });

    } catch (error) {
        return res.status(500).json({ message: 'Error verifying email', error });
    }
};


//user login
exports.loginUser = async (req, res) => {
    try {
        // Validate the request body using Joi
        const { error } = loginUserSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        } else if (!user.isVerified) {
            return res.status(401).json({ message: 'User is not verified' });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate a JWT token (expires in 1 hour)
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Send the JWT token in the response
        res.status(200).json({
            message: 'Login successful!',
            token,
            user: { name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};


exports.verifyEmailPassword = async (req, res) => {
    try {
        // Validate the request body using Joi
        const { error } = updatePasswordSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { email } = req.body;

        // Check if the user exists in the database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a verification token (expires in 1 hour)
        const token = jwt.sign({ email, newPassword }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send verification email
        const resetPassUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        await sendVerificationEmail(email, resetPassUrl, 'updatePassword');

        res.status(200).json({ message: 'Verification email sent. Please check your inbox' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending verification email', error });
    }
};


exports.verifyUpdatePassword = async (req, res) => {
    try {
        const { token } = req.query;

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email, newPassword } = decoded;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash the new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();

        res.status(200).json({ message: 'Password updated successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating password', error });
    }
};


// exports.verifyEmailPass=async(req,res)=>{

//     try {
//         // Validate the request body using Joi
//         const { error } = updatePasswordSchema.validate(req.body);
//         if (error) return res.status(400).json({ message: error.details[0].message });

//         const { email, newPassword } = req.body;

//         // Check if the user exists in the database
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Generate a verification token (expires in 1 hour)
//         const token = jwt.sign({ email, newPassword }, process.env.JWT_SECRET, { expiresIn: '1h' });


//         const resetPassUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

//         // Send verification email
//         await sendVerificationEmail(email,resetPassUrl, 'updatePassword');

//         res.status(200).json({ message: 'Verification email sent. Please check your inbox',token:token });
//     } catch (error) {
//         res.status(500).json({ message: 'Error sending verification email', error });
//     }

// }

// exports.updatePassword = async (req, res) => {
//     try {
//         // Validate the request body using Joi
//         const { error } = updatePasswordSchema.validate(req.body);
//         if (error) return res.status(400).json({ message: error.details[0].message });

//         const { email, newPassword } = req.body;

//         // Check if the user exists in the database
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Hash the new password
//         const hashedPassword = await bcrypt.hash(newPassword, 10);

//         // Update the user's password
//         user.password = hashedPassword;
//         await user.save();

//         res.status(200).json({ message: 'Password updated successfully!' });
//     } catch (error) {
//         res.status(500).json({ message: 'Error updating password', error });
//     }
// };

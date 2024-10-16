const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const verificationLink = `http://localhost:5555/api/users/verify-email?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Verify your email',
            html: `<p>Please click the link below to verify your email: </p>
                   <a href="${verificationLink}">Verify Email</a>`
        };

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent');

    } catch (error) {
        console.error('Error sending email', error);
    }
};

module.exports = sendVerificationEmail;
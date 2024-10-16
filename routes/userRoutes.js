const express = require('express');
const { createUser, updatePassword ,loginUser ,verifyEmail,verifyUpdatePassword,verifyEmailPassword,verifyDBEmail} = require('../controllers/userController');

const router = express.Router();

router.post('/register', createUser);
router.get('/verify-email',verifyEmail)
// router.get('/verify-email',(req,res)=>{
// console.log(req.query)
// })
router.post('/send-verification-email',verifyDBEmail)
router.post('/send-reset-password-email', verifyEmailPassword);
router.post('/login',loginUser)
router.put('/reset-password',verifyUpdatePassword)

module.exports = router;
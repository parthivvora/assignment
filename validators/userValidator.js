const Joi = require('joi');

// Schema for creating a new user
const createUserSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

// Schema for updating the password
const updatePasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    newPassword: Joi.string().min(6).required(),
});

const emailValidation = Joi.object({
    email: Joi.string().email().required(),
});
// Schema for user login
const loginUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

module.exports = {
    createUserSchema,
    updatePasswordSchema,
    loginUserSchema,
    emailValidation
};
const Joi = require("joi");

exports.createUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  loginType: Joi.string().required(),
});

exports.updatePasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  newPassword: Joi.string().min(6).required(),
});

exports.emailValidation = Joi.object({
  email: Joi.string().email().required(),
});

exports.loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

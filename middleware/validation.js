const Joi = require('joi');

// Portfolio validation schemas
const portfolioSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).allow(null, '')
});

const portfolioUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  description: Joi.string().max(1000).allow(null, '')
}).min(1);

// Portfolio item validation schemas
const portfolioItemSchema = Joi.object({
  portfolio_id: Joi.number().integer().positive().required(),
  symbol: Joi.string().min(1).max(20).required(),
  name: Joi.string().min(1).max(255).required(),
  type: Joi.string().valid('stock', 'bond', 'cash', 'crypto', 'etf', 'mutual_fund', 'other').required(),
  quantity: Joi.number().positive().required(),
  purchase_price: Joi.number().positive().required(),
  current_price: Joi.number().positive().optional(),
  purchase_date: Joi.date().max('now').required(),
  sector: Joi.string().max(100).allow(null, ''),
  currency: Joi.string().length(3).default('USD')
});

const portfolioItemUpdateSchema = Joi.object({
  symbol: Joi.string().min(1).max(20),
  name: Joi.string().min(1).max(255),
  type: Joi.string().valid('stock', 'bond', 'cash', 'crypto', 'etf', 'mutual_fund', 'other'),
  quantity: Joi.number().positive(),
  purchase_price: Joi.number().positive(),
  current_price: Joi.number().positive(),
  purchase_date: Joi.date().max('now'),
  sector: Joi.string().max(100).allow(null, ''),
  currency: Joi.string().length(3)
}).min(1);

const priceUpdateSchema = Joi.object({
  symbol: Joi.string().min(1).max(20).required(),
  price: Joi.number().positive().required()
});

// Validation middleware factory
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    req.validatedBody = value;
    next();
  };
};

// Parameter validation middleware
const validateParams = (paramSchema) => {
  return (req, res, next) => {
    const { error, value } = paramSchema.validate(req.params, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Parameter validation failed',
        errors
      });
    }
    
    req.validatedParams = value;
    next();
  };
};

// Common parameter schemas
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  portfolioSchema,
  portfolioUpdateSchema,
  portfolioItemSchema,
  portfolioItemUpdateSchema,
  priceUpdateSchema,
  idParamSchema,
  validateRequest,
  validateParams
};

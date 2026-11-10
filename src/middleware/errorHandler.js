import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(error, _req, res, _next) {
  let normalizedError = error;

  if (error instanceof mongoose.Error.CastError) {
    normalizedError = new AppError('A supplied resource ID is invalid', 400);
  } else if (error instanceof mongoose.Error.ValidationError) {
    normalizedError = new AppError('Database validation failed', 400,
      Object.values(error.errors).map((item) => ({ field: item.path, message: item.message })));
  } else if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? 'field';
    normalizedError = new AppError(`${field} already exists`, 409);
  }

  const statusCode = normalizedError.statusCode ?? 500;
  const response = {
    status: 'error',
    message: statusCode === 500 && env.NODE_ENV === 'production'
      ? 'Something went wrong on the server'
      : normalizedError.message
  };

  if (normalizedError.details) response.details = normalizedError.details;
  if (env.NODE_ENV !== 'production' && statusCode === 500) {
    response.stack = normalizedError.stack;
  }

  if (statusCode === 500) console.error(error);
  res.status(statusCode).json(response);
}

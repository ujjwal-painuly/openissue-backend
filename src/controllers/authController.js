import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { createAccessToken } from '../utils/token.js';

function sendAuthenticatedUser(res, user, statusCode = 200) {
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl
  };

  return res.status(statusCode).json({
    status: 'success',
    data: {
      user: safeUser,
      token: createAccessToken(user)
    }
  });
}

export async function register(req, res) {
  const { name, email, password } = req.validated.body;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) throw new AppError('An account with this email already exists', 409);

  // Passwords are never stored directly. bcrypt adds a salt and makes guessing expensive.
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: normalizedEmail, passwordHash });

  return sendAuthenticatedUser(res, user, 201);
}

export async function login(req, res) {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

  // Use the same message for unknown email and wrong password to avoid account enumeration.
  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    throw new AppError('Email or password is incorrect', 401);
  }

  return sendAuthenticatedUser(res, user);
}

export async function getCurrentUser(req, res) {
  return res.json({
    status: 'success',
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl
      }
    }
  });
}

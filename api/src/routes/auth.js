import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware.js';

export const authRouter = Router();

function setCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ message: 'Valid email and password (min 6 chars) are required' });
    }
    
    let user = await User.findOne({ email });
    if (user) return res.status(409).json({ message: 'Email already exists' });
    
    user = await User.create({ email, password });
    
    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, { expiresIn: '7d' });
    setCookie(res, token);
    
    res.json({ id: user._id, email: user.email });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, { expiresIn: '7d' });
    setCookie(res, token);
    
    res.json({ id: user._id, email: user.email });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, email: user.email });
  } catch (err) {
    next(err);
  }
});

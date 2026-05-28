import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import { AuthRequest } from '../middlewares/verifyToken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'

function makeToken(userId: string, username: string) {
  return jwt.sign({ userId, username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  } as jwt.SignOptions)
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      res.status(400).json({ error: 'All fields are required' })
      return
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' })
      return
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] })
    if (existing) {
      const field = existing.email === email ? 'Email' : 'Username'
      res.status(409).json({ error: `${field} already taken` })
      return
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await User.create({ username, email, password: hashed })
    const token = makeToken(String(user._id), user.username)

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' })
      return
    }

    const user = await User.findOne({ email })
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = makeToken(String(user._id), user.username)
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
}

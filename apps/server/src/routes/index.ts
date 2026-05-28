import { Router } from 'express'
import { login, register, getMe } from '../controllers/authController'
import { verifyToken } from '../middlewares/verifyToken'

export const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.get('/me', verifyToken, getMe)

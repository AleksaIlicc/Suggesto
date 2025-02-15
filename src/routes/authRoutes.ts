import express from 'express';
import authController from '../controllers/authController';
import { validateDto } from '../middlewares/validateDto';
import { CreateUserDto } from '../dtos/auth/create-user.dto';
import { LoginUserDto } from '../dtos/auth/login-user.dto';

const router = express.Router();

// Get methods
router.get('/register', authController.getRegister);
router.get('/login', authController.getLogin);
router.get('/logout', authController.getLogout);

// Post methods
router.post(
  '/login',
  [validateDto(LoginUserDto, 'body')],
  authController.postLogin
);
router.post(
  '/register',
  [validateDto(CreateUserDto, 'body')],
  authController.postRegister
);

export default router;

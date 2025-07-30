import express from 'express';
import authController from '../controllers/authController';
import { validateDto } from '../middlewares/validateDto';
import { CreateUserDto } from '../dtos/auth/create-user.dto';
import { LoginUserDto } from '../dtos/auth/login-user.dto';
import { ForgotPasswordDto } from '../dtos/auth/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/auth/reset-password.dto';

const router = express.Router();

// Get methods
router.get('/register', authController.getRegister);
router.get('/login', authController.getLogin);
router.get('/logout', authController.getLogout);
router.get('/forgot-password', authController.getForgotPassword);
router.get('/reset-password', authController.getResetPassword);

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
router.post(
  '/forgot-password',
  [validateDto(ForgotPasswordDto, 'body')],
  authController.postForgotPassword
);
router.post(
  '/reset-password',
  [validateDto(ResetPasswordDto, 'body')],
  authController.postResetPassword
);

export default router;

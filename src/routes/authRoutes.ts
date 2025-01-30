import express from 'express';
import authController from '../controllers/authController';

const router = express.Router();

// Get methods
router.get('/signup', authController.getSignup);
router.get('/login', authController.getLogin);

export default router;

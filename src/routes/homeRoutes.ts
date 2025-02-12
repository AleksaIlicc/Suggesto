import express from 'express';
import homeController from '../controllers/homeController';

const router = express.Router();

// Get methods
router.get('/', homeController.getHome);
router.get('/app', homeController.getApp);

export default router;

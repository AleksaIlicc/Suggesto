import express from 'express';
import appController from '../controllers/appController';
import { validateDto } from '../middlewares/validateDto';
import { AddAppDto } from '../dtos/app/add-app.dto';

const router = express.Router();

// Get methods
router.get('/', appController.getApps);
router.get('/add', appController.getAddApp);
router.get('/:id', appController.getApp);

// Post methods
router.post('/add', [validateDto(AddAppDto, 'body')], appController.postAddApp);

export default router;

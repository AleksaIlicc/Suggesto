import express from 'express';
import appController from '../controllers/appController';
import { validateDto } from '../middlewares/validateDto';
import { AddAppDto } from '../dtos/app/add-app.dto';
import { AddSuggestionDto } from '../dtos/app/add-suggestion.dto';

const router = express.Router();

// Get methods
router.get('/', appController.getApps);
router.get('/add-app', appController.getAddApp);
router.get('/:id/add-suggestion', appController.getAddSuggestion);
router.get('/:id', appController.getApp);

// Post methods
router.post(
  '/add-app',
  [validateDto(AddAppDto, 'body')],
  appController.postAddApp
);
router.post(
  '/:id/add-suggestion',
  // [validateDto(AddSuggestionDto, 'body')],
  appController.postAddSuggestion
);

export default router;

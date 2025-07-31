import express from 'express';
import appController from '../controllers/appController';
import { validateDto } from '../middlewares/validateDto';
import { requireAuth } from '../middlewares/auth';
import { AddAppDto } from '../dtos/app/add-app.dto';
import { AddSuggestionDto } from '../dtos/app/add-suggestion.dto';
import { EditAppDto } from '../dtos/app/edit-app.dto';
import { UpdateStatusDto } from '../dtos/app/update-status.dto';
import upload from '../config/multer';

const router = express.Router();

// Authenticated routes for app management (specific routes MUST come before dynamic routes)
// Fixed: add-app route now comes before /:id to prevent routing conflicts
router.get('/', requireAuth, appController.getApps);
router.get('/add-app', requireAuth, appController.getAddApp);
router.post(
  '/add-app',
  requireAuth,
  [validateDto(AddAppDto, 'body')],
  appController.postAddApp
);

// Public app view and suggestion routes (no authentication required)
router.get('/:id', appController.getApp);
router.get('/:id/add-suggestion', appController.getAddSuggestion);
router.post(
  '/:id/add-suggestion',
  upload.array('files', 3),
  [validateDto(AddSuggestionDto, 'body')],
  appController.postAddSuggestion
);

// API routes for AJAX requests (voting - no auth required)
router.post(
  '/api/suggestions/:suggestionId/vote',
  appController.voteOnSuggestion
);

// API routes for logo upload/removal (authenticated)
router.post(
  '/api/upload-logo',
  requireAuth,
  upload.single('logo'),
  appController.uploadLogo
);
router.delete('/api/remove-logo/:appId', requireAuth, appController.removeLogo);

// Authenticated routes that need to come after /:id routes to avoid conflicts
router.get('/:id/edit', requireAuth, appController.getEditApp);

// PUT methods (for editing) - authenticated
router.put(
  '/:id',
  requireAuth,
  [validateDto(EditAppDto, 'body')],
  appController.putEditApp
);

// DELETE methods - authenticated
router.delete('/:id', requireAuth, appController.deleteApp);

// API routes for authenticated actions
router.put(
  '/api/suggestions/:suggestionId/status',
  requireAuth,
  [validateDto(UpdateStatusDto, 'body')],
  appController.updateSuggestionStatus
);

export default router;

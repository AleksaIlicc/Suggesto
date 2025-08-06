import { Router } from 'express';
import roadmapController from '../controllers/roadmapController';
import { requireAuth } from '../middlewares/auth';
import { validateDto } from '../middlewares/validateDto';
import { AddRoadmapItemDto } from '../dtos/roadmap/add-roadmap-item.dto';
import { EditRoadmapItemDto } from '../dtos/roadmap/edit-roadmap-item.dto';

const router = Router();

// Public roadmap view
router.get('/:appId/roadmap', roadmapController.getRoadmap);

// Management routes (requires authentication and ownership) - These must come BEFORE the wildcard :itemId route
router.get(
  '/:appId/roadmap/add',
  requireAuth,
  roadmapController.getAddRoadmapItem
);
router.post(
  '/:appId/roadmap/add',
  requireAuth,
  validateDto(AddRoadmapItemDto),
  roadmapController.postAddRoadmapItem
);

router.get(
  '/:appId/roadmap/:itemId/edit',
  requireAuth,
  roadmapController.getEditRoadmapItem
);
router.post(
  '/:appId/roadmap/:itemId/edit',
  requireAuth,
  validateDto(EditRoadmapItemDto),
  roadmapController.putEditRoadmapItem
);

router.delete(
  '/:appId/roadmap/:itemId',
  requireAuth,
  roadmapController.deleteRoadmapItem
);

// Public roadmap item detail view - This must come AFTER specific routes to avoid conflicts
router.get('/:appId/roadmap/:itemId', roadmapController.getRoadmapItemDetail);

export default router;

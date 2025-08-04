import { Request, Response } from 'express';
import RoadmapItem, { IRoadmapItem } from '../models/RoadmapItem';
import Application from '../models/Application';
import { IUser } from '../models/User';
import { AddRoadmapItemDto } from '../dtos/roadmap/add-roadmap-item.dto';
import { EditRoadmapItemDto } from '../dtos/roadmap/edit-roadmap-item.dto';

const getRoadmap = async (req: Request, res: Response): Promise<void> => {
  try {
    const appId = req.params.appId;
    const user = req.user as IUser | undefined;

    const app = await Application.findById(appId);

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/');
    }

    // Check if roadmap is enabled
    if (!app.enablePublicRoadmap) {
      req.flash('error', 'Public roadmap is not enabled for this application.');
      return res.status(403).redirect(`/apps/${appId}`);
    }

    // Check if app is private and user has permission to view
    const isAppOwner = user && user._id.toString() === app.user._id.toString();
    if (!app.isPublic && !isAppOwner) {
      req.flash('error', 'This application is private.');
      return res.status(403).redirect('/');
    }

    // Get roadmap items grouped by status
    const roadmapItems = await RoadmapItem.find({ applicationId: appId })
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('suggestion', 'title description')
      .sort({ order: 1, createdAt: -1 });

    // Group items by status
    const groupedItems = {
      planned: roadmapItems.filter(item => item.status === 'planned'),
      'in-progress': roadmapItems.filter(item => item.status === 'in-progress'),
      completed: roadmapItems.filter(item => item.status === 'completed'),
      cancelled: roadmapItems.filter(item => item.status === 'cancelled'),
    };

    res.render('pages/roadmap/roadmap', {
      app,
      user,
      roadmapItems: groupedItems,
      isOwner: isAppOwner,
    });
  } catch (err: unknown) {
    console.error('❌ Error in getRoadmap:', err);
    req.flash('error', 'Failed to fetch roadmap. Please try again.');
    return res.status(500).redirect('/');
  }
};

const getAddRoadmapItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const appId = req.params.appId;
    const user = req.user as IUser;

    const app = await Application.findOne({ _id: appId, user: user._id });

    if (!app) {
      req.flash(
        'error',
        'Application not found or you do not have permission to manage it.'
      );
      return res.status(404).redirect('/apps');
    }

    res.render('pages/roadmap/add-roadmap-item', { app, user });
  } catch (err: unknown) {
    console.error('❌ Error in getAddRoadmapItem:', err);
    req.flash(
      'error',
      'Failed to load add roadmap item page. Please try again.'
    );
    return res.status(500).redirect('/apps');
  }
};

const postAddRoadmapItem = async (
  req: Request<{ appId: string }, {}, AddRoadmapItemDto>,
  res: Response
): Promise<void> => {
  try {
    const appId = req.params.appId;
    const user = req.user as IUser;

    const app = await Application.findOne({ _id: appId, user: user._id });

    if (!app) {
      req.flash(
        'error',
        'Application not found or you do not have permission to manage it.'
      );
      return res.status(404).redirect('/apps');
    }

    // Get the highest order number for the status
    const lastItem = await RoadmapItem.findOne({
      applicationId: appId,
      status: req.body.status || 'planned',
    }).sort({ order: -1 });

    const newOrder = lastItem ? lastItem.order + 1 : 0;

    // Parse tags if they come as JSON string
    let tags: string[] = [];
    if (req.body.tags) {
      try {
        tags =
          typeof req.body.tags === 'string'
            ? JSON.parse(req.body.tags)
            : req.body.tags;
      } catch (e) {
        tags = [];
      }
    }

    const newRoadmapItem = new RoadmapItem({
      applicationId: appId,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status || 'planned',
      priority: req.body.priority || 'medium',
      type: req.body.type || 'feature',
      suggestion: req.body.suggestion || undefined,
      estimatedReleaseDate: req.body.estimatedReleaseDate || undefined,
      tags: tags,
      assignedTo: req.body.assignedTo || undefined,
      progress: req.body.progress || 0,
      order: newOrder,
      createdBy: user._id,
    });

    await newRoadmapItem.save();

    req.flash('success', 'Roadmap item created successfully.');
    return res.status(201).redirect(`/apps/${appId}/roadmap`);
  } catch (err: unknown) {
    console.error('❌ Error in postAddRoadmapItem:', err);
    req.flash('error', 'Failed to create roadmap item. Please try again.');
    return res.status(500).redirect(`/apps/${req.params.appId}/roadmap/add`);
  }
};

const getEditRoadmapItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { appId, itemId } = req.params;
    const user = req.user as IUser;

    const app = await Application.findOne({ _id: appId, user: user._id });

    if (!app) {
      req.flash(
        'error',
        'Application not found or you do not have permission to manage it.'
      );
      return res.status(404).redirect('/apps');
    }

    const roadmapItem = await RoadmapItem.findOne({
      _id: itemId,
      applicationId: appId,
    }).populate('suggestion', 'title description');

    if (!roadmapItem) {
      req.flash('error', 'Roadmap item not found.');
      return res.status(404).redirect(`/apps/${appId}/roadmap`);
    }

    res.render('pages/roadmap/edit-roadmap-item', { app, user, roadmapItem });
  } catch (err: unknown) {
    console.error('❌ Error in getEditRoadmapItem:', err);
    req.flash(
      'error',
      'Failed to load edit roadmap item page. Please try again.'
    );
    return res.status(500).redirect(`/apps/${req.params.appId}/roadmap`);
  }
};

const putEditRoadmapItem = async (
  req: Request<{ appId: string; itemId: string }, {}, EditRoadmapItemDto>,
  res: Response
): Promise<void> => {
  try {
    const { appId, itemId } = req.params;
    const user = req.user as IUser;

    const app = await Application.findOne({ _id: appId, user: user._id });

    if (!app) {
      req.flash(
        'error',
        'Application not found or you do not have permission to manage it.'
      );
      return res.status(404).redirect('/apps');
    }

    const roadmapItem = await RoadmapItem.findOne({
      _id: itemId,
      applicationId: appId,
    });

    if (!roadmapItem) {
      req.flash('error', 'Roadmap item not found.');
      return res.status(404).redirect(`/apps/${appId}/roadmap`);
    }

    // Update fields
    if (req.body.title !== undefined) roadmapItem.title = req.body.title;
    if (req.body.description !== undefined)
      roadmapItem.description = req.body.description;
    if (req.body.status !== undefined)
      roadmapItem.status = req.body.status as any;
    if (req.body.priority !== undefined)
      roadmapItem.priority = req.body.priority as any;
    if (req.body.type !== undefined) roadmapItem.type = req.body.type as any;
    if (req.body.estimatedReleaseDate !== undefined) {
      roadmapItem.estimatedReleaseDate = req.body.estimatedReleaseDate
        ? new Date(req.body.estimatedReleaseDate)
        : undefined;
    }
    if (req.body.actualReleaseDate !== undefined) {
      roadmapItem.actualReleaseDate = req.body.actualReleaseDate
        ? new Date(req.body.actualReleaseDate)
        : undefined;
    }
    if (req.body.tags !== undefined) {
      // Parse tags if they come as JSON string
      try {
        roadmapItem.tags =
          typeof req.body.tags === 'string'
            ? JSON.parse(req.body.tags)
            : req.body.tags;
      } catch (e) {
        roadmapItem.tags = [];
      }
    }
    if (req.body.assignedTo !== undefined)
      roadmapItem.assignedTo = req.body.assignedTo
        ? (req.body.assignedTo as any)
        : undefined;
    if (req.body.progress !== undefined)
      roadmapItem.progress = req.body.progress;
    if (req.body.changelogNotes !== undefined)
      roadmapItem.changelogNotes = req.body.changelogNotes;
    if (req.body.order !== undefined) roadmapItem.order = req.body.order;

    await roadmapItem.save();

    req.flash('success', 'Roadmap item updated successfully.');
    return res.status(200).redirect(`/apps/${appId}/roadmap`);
  } catch (err: unknown) {
    console.error('❌ Error in putEditRoadmapItem:', err);
    req.flash('error', 'Failed to update roadmap item. Please try again.');
    return res
      .status(500)
      .redirect(`/apps/${req.params.appId}/roadmap/${req.params.itemId}/edit`);
  }
};

const deleteRoadmapItem = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { appId, itemId } = req.params;
    const user = req.user as IUser;

    const app = await Application.findOne({ _id: appId, user: user._id });

    if (!app) {
      req.flash(
        'error',
        'Application not found or you do not have permission to manage it.'
      );
      // Check if it's an AJAX request
      if (req.headers.accept?.includes('application/json')) {
        return res
          .status(404)
          .json({
            error:
              'Application not found or you do not have permission to manage it.',
          });
      }
      return res.status(404).redirect('/apps');
    }

    const roadmapItem = await RoadmapItem.findOneAndDelete({
      _id: itemId,
      applicationId: appId,
    });

    if (!roadmapItem) {
      req.flash('error', 'Roadmap item not found.');
      // Check if it's an AJAX request
      if (req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ error: 'Roadmap item not found.' });
      }
      return res.status(404).redirect(`/apps/${appId}/roadmap`);
    }

    req.flash('success', 'Roadmap item deleted successfully.');
    // Check if it's an AJAX request
    if (req.headers.accept?.includes('application/json')) {
      return res
        .status(200)
        .json({ message: 'Roadmap item deleted successfully.' });
    }
    return res.status(200).redirect(`/apps/${appId}/roadmap`);
  } catch (err: unknown) {
    console.error('❌ Error in deleteRoadmapItem:', err);
    req.flash('error', 'Failed to delete roadmap item. Please try again.');
    // Check if it's an AJAX request
    if (
      req.headers.accept?.includes('application/json') ||
      req.headers['content-type']?.includes('application/json')
    ) {
      return res
        .status(500)
        .json({ error: 'Failed to delete roadmap item. Please try again.' });
    }
    return res.status(500).redirect(`/apps/${req.params.appId}/roadmap`);
  }
};

export default {
  getRoadmap,
  getAddRoadmapItem,
  postAddRoadmapItem,
  getEditRoadmapItem,
  putEditRoadmapItem,
  deleteRoadmapItem,
};

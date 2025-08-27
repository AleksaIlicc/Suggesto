import { Request, Response } from 'express';
import RoadmapItem from '../models/RoadmapItem';
import Application from '../models/Application';
import Suggestion from '../models/Suggestion';
import { IUser } from '../models/User';
import { AddRoadmapItemDto } from '../dtos/roadmap/add-roadmap-item.dto';
import { EditRoadmapItemDto } from '../dtos/roadmap/edit-roadmap-item.dto';
import moment from 'moment-timezone';

const getRoadmap = async (req: Request, res: Response): Promise<void> => {
  try {
    const appId = req.params.appId;
    const user = req.user as IUser | undefined;

    const app = await Application.findById(appId);

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/');
    }

    if (!app.enablePublicRoadmap) {
      req.flash('error', 'Public roadmap is not enabled for this application.');
      return res.status(403).redirect(`/apps/${appId}`);
    }

    const isAppOwner = user && user._id.toString() === app.user._id.toString();
    if (!app.isPublic && !isAppOwner) {
      req.flash('error', 'This application is private.');
      return res.status(403).redirect('/');
    }

    // Get roadmap items grouped by status
    const roadmapItems = await RoadmapItem.find({ applicationId: appId }).sort({
      estimatedReleaseDate: 1,
      createdAt: -1,
    });

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

const getRoadmapItemDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { appId, itemId } = req.params;
    const user = req.user as IUser | undefined;

    const app = await Application.findById(appId);

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/');
    }

    if (!app.enablePublicRoadmap) {
      req.flash('error', 'Public roadmap is not enabled for this application.');
      return res.status(403).redirect(`/apps/${appId}`);
    }

    const isAppOwner = user && user._id.toString() === app.user._id.toString();
    if (!app.isPublic && !isAppOwner) {
      req.flash('error', 'This application is private.');
      return res.status(403).redirect('/');
    }

    const roadmapItem = await RoadmapItem.findOne({
      _id: itemId,
      applicationId: appId,
    }).populate({
      path: 'suggestion',
      select: 'title description category voteCount createdAt',
      populate: {
        path: 'userId',
        select: 'firstName lastName username',
      },
    });

    if (!roadmapItem) {
      req.flash('error', 'Roadmap item not found.');
      return res.status(404).redirect(`/apps/${appId}/roadmap`);
    }

    res.render('pages/roadmap/roadmap-item-detail', {
      app,
      user,
      roadmapItem,
      isOwner: isAppOwner,
    });
  } catch (err: unknown) {
    console.error('❌ Error in getRoadmapItemDetail:', err);
    req.flash(
      'error',
      'Failed to fetch roadmap item details. Please try again.'
    );
    return res.status(500).redirect(`/apps/${req.params.appId}/roadmap`);
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

    const suggestions = await Suggestion.find({ applicationId: appId })
      .select('title description category voteCount')
      .sort({ voteCount: -1, createdAt: -1 });

    res.render('pages/roadmap/add-roadmap-item', { app, user, suggestions });
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

    const newRoadmapItemData: any = {
      applicationId: appId,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
    };

    newRoadmapItemData.priority = req.body.priority || undefined;
    newRoadmapItemData.type = req.body.type || undefined;
    newRoadmapItemData.suggestion = req.body.suggestion || undefined;
    newRoadmapItemData.estimatedReleaseDate = req.body.estimatedReleaseDate
      ? moment.utc(req.body.estimatedReleaseDate).toDate()
      : undefined;

    const newRoadmapItem = new RoadmapItem(newRoadmapItemData);

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

    const suggestions = await Suggestion.find({ applicationId: appId })
      .select('title description category voteCount')
      .sort({ voteCount: -1, createdAt: -1 });

    res.render('pages/roadmap/edit-roadmap-item', {
      app,
      user,
      item: roadmapItem,
      suggestions,
    });
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

    roadmapItem.title = req.body.title || undefined;
    roadmapItem.description = req.body.description || undefined;
    roadmapItem.status = req.body.status || 'planned';
    roadmapItem.priority = req.body.priority || 'medium';
    roadmapItem.type = req.body.type || 'feature';
    roadmapItem.suggestion = (req.body.suggestion as any) || undefined;
    roadmapItem.estimatedReleaseDate = req.body.estimatedReleaseDate
      ? moment.utc(req.body.estimatedReleaseDate).toDate()
      : undefined;

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

      if (req.headers.accept?.includes('application/json')) {
        return res.status(404).json({
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
      if (req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ error: 'Roadmap item not found.' });
      }
      return res.status(404).redirect(`/apps/${appId}/roadmap`);
    }

    req.flash('success', 'Roadmap item deleted successfully.');
    if (req.headers.accept?.includes('application/json')) {
      return res
        .status(200)
        .json({ message: 'Roadmap item deleted successfully.' });
    }
    return res.status(200).redirect(`/apps/${appId}/roadmap`);
  } catch (err: unknown) {
    console.error('❌ Error in deleteRoadmapItem:', err);
    req.flash('error', 'Failed to delete roadmap item. Please try again.');
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
  getRoadmapItemDetail,
  getAddRoadmapItem,
  postAddRoadmapItem,
  getEditRoadmapItem,
  putEditRoadmapItem,
  deleteRoadmapItem,
};

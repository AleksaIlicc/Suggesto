import { Request, Response } from 'express';
import Application from '../models/Application';
import { IUser } from '../models/User';
import { AddAppDto } from '../dtos/app/add-app.dto';
import { AddSuggestionDto } from '../dtos/app/add-suggestion.dto';
import { EditAppDto } from '../dtos/app/edit-app.dto';
import { UpdateStatusDto } from '../dtos/app/update-status.dto';
import Suggestion from '../models/Suggestion';
import Vote from '../models/Vote';

const getApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser | undefined;
    const sessionId = req.sessionID;

    const app = await Application.findOne({
      _id: req.params.id,
    }).populate('user');

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/');
    }

    // Get detailed suggestions with vote counts and user vote status
    const suggestions = await Suggestion.find({ applicationId: app._id })
      .populate('userId', 'firstName lastName username')
      .sort({ voteCount: -1, createdAt: -1 });

    // Check which suggestions the current user/session has voted for
    let userVotes: string[] = [];
    if (user) {
      const votes = await Vote.find({
        user: user._id,
        suggestion: { $in: suggestions.map(s => s._id) },
      });
      userVotes = votes.map(v => v.suggestion.toString());
    } else {
      const votes = await Vote.find({
        sessionId: sessionId,
        suggestion: { $in: suggestions.map(s => s._id) },
      });
      userVotes = votes.map(v => v.suggestion.toString());
    }

    const enhancedSuggestions = suggestions.map(suggestion => ({
      ...suggestion.toObject(),
      hasUserVoted: userVotes.includes(suggestion._id.toString()),
    }));

    // Update lastOpened timestamp if the current user is the app owner
    const isOwner = user && user._id.toString() === app.user._id.toString();
    if (isOwner) {
      await Application.findByIdAndUpdate(app._id, { lastOpened: new Date() });
    }

    res.render('pages/apps/app', {
      app,
      suggestions: enhancedSuggestions,
      isOwner,
      user,
    });
  } catch (err: unknown) {
    req.flash('error', 'Failed to fetch application. Please try again.');
    return res.status(500).redirect('/');
  }
};

const getApps = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;

    const apps = await Application.find({
      user: user._id,
    });

    res.render('pages/apps/my-apps', { apps });
  } catch (err: unknown) {
    req.flash('error', 'Failed to fetch your applications. Please try again.');
    return res.status(500).redirect('/');
  }
};

const getAddApp = async (req: Request, res: Response): Promise<void> => {
  return res.render('pages/apps/add-app');
};

const postAddApp = async (
  req: Request<{}, {}, AddAppDto>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser;

    const newApp = new Application({
      name: req.body.name,
      description: req.body.description,
      design: {
        headerColor: req.body.headerColor,
        buttonColor: req.body.buttonColor,
        backgroundColor: req.body.backgroundColor,
        logo: req.body.logo || '',
      },
      user: user._id,
    });

    await newApp.save();

    req.flash('success', 'Application has been created successfully.');
    return res.status(201).redirect('/apps');
  } catch (error: unknown) {
    req.flash('error', 'Failed to create application. Please try again.');
    return res.status(500).redirect('/apps/add-app');
  }
};

const getAddSuggestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser | undefined;
    const _id = req.params.id;

    const app = await Application.findOne({
      _id: _id,
    });

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/');
    }

    res.render('pages/apps/add-suggestion', { appId: _id, app, user });
  } catch (err: unknown) {
    req.flash('error', 'Failed to fetch application. Please try again.');
    return res.status(500).redirect('/');
  }
};

const postAddSuggestion = async (
  req: Request<{ id: string }, {}, AddSuggestionDto>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser | undefined;
    const files = (req as any).files;

    const app = await Application.findOne({
      _id: req.params.id,
    });

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/apps');
    }

    // Process uploaded files
    const processedFiles = files
      ? files.map((file: any) => ({
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
        }))
      : [];

    const newSuggestion = new Suggestion({
      title: req.body.title,
      description: req.body.description,
      status: 'pending',
      applicationId: req.params.id,
      userId: user ? user._id : null, // Support anonymous submissions
      files: processedFiles,
      voteCount: 0,
    });

    await newSuggestion.save();

    // Update the application's suggestions array (for backward compatibility)
    app.suggestions.push({
      _id: newSuggestion._id,
      title: req.body.title,
      description: req.body.description,
      count: app.suggestions.length + 1,
      voteCount: 0,
    });

    await app.save();

    req.flash('success', 'Your suggestion has been submitted successfully!');
    return res.status(201).redirect(`/apps/${req.params.id}`);
  } catch (error: unknown) {
    req.flash('error', 'Failed to submit suggestion. Please try again.');
    return res.status(500).redirect(`/apps/${req.params.id}/add-suggestion`);
  }
};

// New functions for additional features

const getEditApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;

    const app = await Application.findOne({
      _id: req.params.id,
      user: user._id,
    });

    if (!app) {
      req.flash(
        'error',
        'Application not found or you do not have permission to edit it.'
      );
      return res.status(404).redirect('/apps');
    }

    res.render('pages/apps/edit-app', { app });
  } catch (err: unknown) {
    req.flash(
      'error',
      'Failed to fetch application for editing. Please try again.'
    );
    return res.status(500).redirect('/apps');
  }
};

const putEditApp = async (
  req: Request<{ id: string }, {}, EditAppDto>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser;

    const app = await Application.findOne({
      _id: req.params.id,
      user: user._id,
    });

    if (!app) {
      req.flash(
        'error',
        'Application not found or you do not have permission to edit it.'
      );
      return res.status(404).redirect('/apps');
    }

    // Update application fields
    app.name = req.body.name;
    app.description = req.body.description;
    app.design = {
      headerColor: req.body.headerColor,
      buttonColor: req.body.buttonColor,
      backgroundColor: req.body.backgroundColor,
      logo: req.body.logo || app.design?.logo || '',
    };

    await app.save();

    req.flash('success', 'Application has been updated successfully.');
    return res.status(200).redirect(`/apps/${app._id}`);
  } catch (error: unknown) {
    req.flash('error', 'Failed to update application. Please try again.');
    return res.status(500).redirect(`/apps/${req.params.id}/edit`);
  }
};

const deleteApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;

    const app = await Application.findOne({
      _id: req.params.id,
      user: user._id,
    });

    if (!app) {
      req.flash(
        'error',
        'Application not found or you do not have permission to delete it.'
      );
      return res.status(404).redirect('/apps');
    }

    // Delete all related suggestions and votes
    const suggestions = await Suggestion.find({ applicationId: app._id });
    const suggestionIds = suggestions.map(s => s._id);

    // Delete all votes for these suggestions
    await Vote.deleteMany({ suggestion: { $in: suggestionIds } });

    // Delete all suggestions
    await Suggestion.deleteMany({ applicationId: app._id });

    // Delete the application
    await Application.findByIdAndDelete(app._id);

    req.flash(
      'success',
      'Application and all related data have been deleted successfully.'
    );
    return res.status(200).redirect('/apps');
  } catch (error: unknown) {
    req.flash('error', 'Failed to delete application. Please try again.');
    return res.status(500).redirect('/apps');
  }
};

const voteOnSuggestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser | undefined;
    const suggestionId = req.params.suggestionId;
    const sessionId = req.sessionID;

    const suggestion = await Suggestion.findById(suggestionId);
    if (!suggestion) {
      res.status(404).json({ success: false, message: 'Suggestion not found' });
      return;
    }

    // Check if user has already voted (for both logged-in and anonymous users)
    let existingVote;
    if (user) {
      existingVote = await Vote.findOne({
        user: user._id,
        suggestion: suggestionId,
      });
    } else {
      existingVote = await Vote.findOne({
        sessionId: sessionId,
        suggestion: suggestionId,
      });
    }

    if (existingVote) {
      // Remove vote (toggle off)
      await Vote.findByIdAndDelete(existingVote._id);
      suggestion.voteCount = Math.max(0, suggestion.voteCount - 1);
      await suggestion.save();

      // Update application's suggestions array
      const app = await Application.findById(suggestion.applicationId);
      if (app) {
        const suggestionInApp = app.suggestions.find(
          s => s._id.toString() === suggestionId
        );
        if (suggestionInApp) {
          suggestionInApp.voteCount = suggestion.voteCount;
        }
        await app.save();
      }

      res.json({
        success: true,
        voted: false,
        voteCount: suggestion.voteCount,
      });
      return;
    } else {
      // Add vote
      const newVote = new Vote({
        user: user ? user._id : undefined,
        sessionId: user ? undefined : sessionId,
        suggestion: suggestionId,
      });
      await newVote.save();

      suggestion.voteCount += 1;
      await suggestion.save();

      // Update application's suggestions array
      const app = await Application.findById(suggestion.applicationId);
      if (app) {
        const suggestionInApp = app.suggestions.find(
          s => s._id.toString() === suggestionId
        );
        if (suggestionInApp) {
          suggestionInApp.voteCount = suggestion.voteCount;
        }
        await app.save();
      }

      res.json({
        success: true,
        voted: true,
        voteCount: suggestion.voteCount,
      });
      return;
    }
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: 'Failed to process vote' });
  }
};

const updateSuggestionStatus = async (
  req: Request<{ suggestionId: string }, {}, UpdateStatusDto>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const suggestionId = req.params.suggestionId;

    const suggestion = await Suggestion.findById(suggestionId);
    if (!suggestion) {
      res.status(404).json({
        success: false,
        message: 'Suggestion not found.',
      });
      return;
    }

    // Check if user is the owner of the application
    const app = await Application.findOne({
      _id: suggestion.applicationId,
      user: user._id,
    });

    if (!app) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to update this suggestion status.',
      });
      return;
    }

    suggestion.status = req.body.status as any;
    await suggestion.save();

    res.status(200).json({
      success: true,
      message: 'Suggestion status has been updated successfully.',
    });
  } catch (error: unknown) {
    req.flash('error', 'Failed to update suggestion status. Please try again.');
    return res.status(500).redirect('/apps');
  }
};

export default {
  getApp,
  getApps,
  getAddApp,
  postAddApp,
  getAddSuggestion,
  postAddSuggestion,
  getEditApp,
  putEditApp,
  deleteApp,
  voteOnSuggestion,
  updateSuggestionStatus,
};

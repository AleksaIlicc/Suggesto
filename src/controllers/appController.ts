import { Request, Response } from 'express';
import Application from '../models/Application';
import { IUser } from '../models/User';
import { AddAppDto } from '../dtos/app/add-app.dto';
import { AddSuggestionDto } from '../dtos/app/add-suggestion.dto';
import { EditAppDto } from '../dtos/app/edit-app.dto';
import Suggestion from '../models/Suggestion';
import Vote from '../models/Vote';
import RoadmapItem from '../models/RoadmapItem';
import { getDefaultCategories } from '../utils/defaultCategories';
import moment from 'moment-timezone';

const getApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser | undefined;
    const sessionId = req.sessionID;
    const sortType = (req.query.sort as string) || 'new';

    const app = await Application.findOne({ _id: req.params.id }).populate(
      'user'
    );

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/');
    }

    const isAppOwner = user && user._id.toString() === app.user._id.toString();
    if (!app.isPublic && !isAppOwner) {
      req.flash('error', 'This application is private.');
      return res.status(403).redirect('/');
    }

    let suggestions;

    if (sortType === 'new') {
      suggestions = [...(app.suggestions || [])].reverse().map(s => ({
        _id: s._id,
        title: s.title,
        description: s.description,
        voteCount: s.voteCount || 0,
        category: s.category,
        hasUserVoted: false,
      }));
    } else if (sortType === 'top') {
      suggestions = [...(app.suggestions || [])]
        .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
        .map(s => ({
          _id: s._id,
          title: s.title,
          description: s.description,
          voteCount: s.voteCount || 0,
          category: s.category,
          hasUserVoted: false,
        }));
    } else if (sortType === 'trending') {
      const twoWeeksAgo = moment().subtract(14, 'days');

      const trendingSuggestions = await Suggestion.aggregate([
        { $match: { applicationId: app._id } },
        {
          $lookup: {
            from: 'votes',
            let: { suggestionId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$suggestion', '$$suggestionId'] },
                      { $gte: ['$createdAt', twoWeeksAgo] },
                    ],
                  },
                },
              },
              { $count: 'count' },
            ],
            as: 'recentVotes',
          },
        },
        {
          $addFields: {
            recentVoteCount: {
              $ifNull: [{ $arrayElemAt: ['$recentVotes.count', 0] }, 0],
            },
          },
        },
        { $sort: { recentVoteCount: -1, createdAt: -1 } },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            category: 1,
            voteCount: 1,
          },
        },
      ]);

      suggestions = trendingSuggestions.map(s => ({
        _id: s._id,
        title: s.title,
        description: s.description,
        voteCount: s.voteCount || 0,
        category: s.category,
        hasUserVoted: false,
      }));
    }

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
      ...suggestion,
      hasUserVoted: userVotes.includes(suggestion._id.toString()),
    }));

    const isOwner = user && user._id.toString() === app.user._id.toString();
    if (isOwner) {
      await Application.findByIdAndUpdate(app._id, { lastOpened: new Date() });
    }

    res.render('pages/apps/app', {
      app,
      suggestions: enhancedSuggestions,
      isOwner,
      user,
      currentSort: sortType,
    });
  } catch (err: unknown) {
    console.error('Error fetching application:', err);
    req.flash('error', 'Failed to fetch application. Please try again.');
    return res.status(500).redirect('/');
  }
};

const getApps = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;

    const apps = await Application.find({ user: user._id });

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
        headerTextColor: req.body.headerTextColor,
        buttonColor: req.body.buttonColor,
        buttonTextColor: req.body.buttonTextColor,
        backButtonColor: req.body.backButtonColor,
        backgroundColor: req.body.backgroundColor,
        suggestionsHeaderColor: req.body.suggestionsHeaderColor,
        suggestionTextColor: req.body.suggestionTextColor,
        suggestionCardBgColor: req.body.suggestionCardBgColor,
        voteButtonBgColor: req.body.voteButtonBgColor,
        voteButtonTextColor: req.body.voteButtonTextColor,
        suggestionMetaColor: req.body.suggestionMetaColor,
        logo: req.body.logo || '',
      },
      customCategories: req.body.customCategories || [],
      defaultCategoriesEnabled: req.body.defaultCategoriesEnabled === 'true',
      // Privacy settings (default to public and allow all)
      isPublic: req.body.isPublic !== 'false',
      allowAnonymousVotes: req.body.allowAnonymousVotes !== 'false',
      allowPublicSubmissions: req.body.allowPublicSubmissions !== 'false',
      // Roadmap settings
      enablePublicRoadmap: req.body.enablePublicRoadmap === 'true',
      user: user._id,
    });

    await newApp.save();

    req.flash('success', 'Application has been created successfully.');
    return res.status(201).redirect('/apps');
  } catch (error: unknown) {
    console.error('Error creating application:', error);
    req.flash('error', 'Failed to create application. Please try again.');
    return res.status(500).redirect('/apps/add-app');
  }
};

const getAddSuggestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser | undefined;
    const _id = req.params.id;

    const app = await Application.findOne({ _id: _id });

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/');
    }

    const isAppOwner = user && user._id.toString() === app.user._id.toString();
    if (!app.isPublic && !isAppOwner) {
      req.flash('error', 'This application is private.');
      return res.status(403).redirect('/');
    }

    if (!user && !app.allowPublicSubmissions) {
      req.flash('error', 'Please sign in to submit suggestions.');
      return res.status(403).redirect('/auth/login');
    }

    const availableCategories = app.defaultCategoriesEnabled
      ? getDefaultCategories()
      : app.customCategories;

    res.render('pages/apps/add-suggestion', {
      appId: _id,
      app,
      user,
      availableCategories,
    });
  } catch (err: unknown) {
    req.flash('error', 'Failed to fetch application. Please try again.');
    return res.status(500).redirect('/');
  }
};

const getSuggestionDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser | undefined;
    const sessionId = req.sessionID;
    const { id: appId, suggestionId } = req.params;

    const app = await Application.findOne({ _id: appId }).populate('user');

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/');
    }

    const isAppOwner = user && user._id.toString() === app.user._id.toString();
    if (!app.isPublic && !isAppOwner) {
      req.flash('error', 'This application is private.');
      return res.status(403).redirect('/');
    }

    const suggestion = await Suggestion.findOne({
      _id: suggestionId,
      applicationId: appId,
    })
      .populate('userId', 'firstName lastName username')
      .populate('comments.user', 'firstName lastName username');

    if (!suggestion) {
      req.flash('error', 'Suggestion not found.');
      return res.status(404).redirect(`/apps/${appId}`);
    }

    let hasUserVoted = false;
    if (user) {
      const existingVote = await Vote.findOne({
        user: user._id,
        suggestion: suggestionId,
      });
      hasUserVoted = !!existingVote;
    } else {
      const existingVote = await Vote.findOne({
        sessionId: sessionId,
        suggestion: suggestionId,
      });
      hasUserVoted = !!existingVote;
    }

    const enhancedSuggestion = {
      ...suggestion.toObject(),
      hasUserVoted,
    };

    res.render('pages/apps/suggestion-detail', {
      app,
      suggestion: enhancedSuggestion,
      user,
      isOwner: isAppOwner,
    });
  } catch (err: unknown) {
    console.error('Error fetching suggestion detail:', err);
    req.flash('error', 'Failed to fetch suggestion. Please try again.');
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

    const app = await Application.findOne({ _id: req.params.id });

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/apps');
    }

    const isAppOwner = user && user._id.toString() === app.user._id.toString();
    if (!app.isPublic && !isAppOwner) {
      req.flash('error', 'This application is private.');
      return res.status(403).redirect('/');
    }

    if (!user && !app.allowPublicSubmissions) {
      req.flash('error', 'Please sign in to submit suggestions.');
      return res.status(403).redirect('/auth/login');
    }

    const processedFiles = files
      ? files.map((file: any) => ({
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
        }))
      : [];

    let selectedCategory = req.body.category;
    if (
      !selectedCategory ||
      !selectedCategory.name ||
      !selectedCategory.color
    ) {
      const availableCategories = app.defaultCategoriesEnabled
        ? getDefaultCategories()
        : app.customCategories;
      selectedCategory =
        availableCategories && availableCategories.length > 0
          ? availableCategories[0]
          : {
              name: 'general',
              color: '#6b7280',
            };
    }

    const newSuggestion = new Suggestion({
      title: req.body.title,
      description: req.body.description,
      category: selectedCategory,
      applicationId: req.params.id,
      userId: user ? user._id : null,
      files: processedFiles,
      voteCount: 0,
    });

    await newSuggestion.save();

    app.suggestions.push({
      _id: newSuggestion._id,
      title: req.body.title,
      description: req.body.description,
      voteCount: 0,
      category: selectedCategory,
    });

    await app.save();

    req.flash('success', 'Your suggestion has been submitted successfully!');
    return res.status(201).redirect(`/apps/${req.params.id}`);
  } catch (error: unknown) {
    req.flash('error', 'Failed to submit suggestion. Please try again.');
    return res.status(500).redirect(`/apps/${req.params.id}/add-suggestion`);
  }
};

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

    const defaultCategories = getDefaultCategories();
    res.render('pages/apps/edit-app', { app, defaultCategories });
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

    app.name = req.body.name;
    app.description = req.body.description;
    app.design = {
      headerColor: req.body.headerColor,
      headerTextColor: req.body.headerTextColor,
      buttonColor: req.body.buttonColor,
      buttonTextColor: req.body.buttonTextColor,
      backButtonColor: req.body.backButtonColor,
      backgroundColor: req.body.backgroundColor,
      suggestionsHeaderColor: req.body.suggestionsHeaderColor,
      suggestionTextColor: req.body.suggestionTextColor,
      suggestionCardBgColor: req.body.suggestionCardBgColor,
      voteButtonBgColor: req.body.voteButtonBgColor,
      voteButtonTextColor: req.body.voteButtonTextColor,
      suggestionMetaColor: req.body.suggestionMetaColor,
      logo: req.body.logo || app.design?.logo || '',
    };

    if (req.body.customCategories !== undefined) {
      app.customCategories = req.body.customCategories;
    }

    app.defaultCategoriesEnabled = req.body.defaultCategoriesEnabled === 'true';

    app.isPublic = req.body.isPublic === 'true';
    app.allowAnonymousVotes = req.body.allowAnonymousVotes === 'true';
    app.allowPublicSubmissions = req.body.allowPublicSubmissions === 'true';

    app.enablePublicRoadmap = req.body.enablePublicRoadmap === 'true';

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

    const suggestions = await Suggestion.find({ applicationId: app._id });
    const suggestionIds = suggestions.map(s => s._id);

    await Vote.deleteMany({ suggestion: { $in: suggestionIds } });

    await Suggestion.deleteMany({ applicationId: app._id });

    await RoadmapItem.deleteMany({ applicationId: app._id });

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

    const app = await Application.findById(suggestion.applicationId);
    if (!app) {
      res
        .status(404)
        .json({ success: false, message: 'Application not found' });
      return;
    }

    const isAppOwner = user && user._id.toString() === app.user._id.toString();
    if (!app.isPublic && !isAppOwner) {
      res
        .status(403)
        .json({ success: false, message: 'This application is private' });
      return;
    }

    if (!user && !app.allowAnonymousVotes) {
      res
        .status(403)
        .json({ success: false, message: 'Please sign in to vote' });
      return;
    }

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
        user: { $exists: false },
      });
    }

    if (existingVote) {
      await Vote.findByIdAndDelete(existingVote._id);
      const newVoteCount = Math.max(0, suggestion.voteCount - 1);

      await Suggestion.findByIdAndUpdate(
        suggestionId,
        { voteCount: newVoteCount },
        { runValidators: false }
      );

      const app = await Application.findById(suggestion.applicationId);
      if (app) {
        const suggestionInApp = app.suggestions.find(
          s => s._id.toString() === suggestionId
        );
        if (suggestionInApp) {
          suggestionInApp.voteCount = newVoteCount;
          await app.save();
        }
      }

      res.json({
        success: true,
        voted: false,
        voteCount: newVoteCount,
      });
      return;
    } else {
      let newVote;
      if (user) {
        newVote = new Vote({
          user: user._id,
          suggestion: suggestionId,
        });
      } else {
        newVote = new Vote({
          sessionId: sessionId,
          suggestion: suggestionId,
        });
      }

      await newVote.save();

      const newVoteCount = suggestion.voteCount + 1;

      await Suggestion.findByIdAndUpdate(
        suggestionId,
        { voteCount: newVoteCount },
        { runValidators: false }
      );

      const app = await Application.findById(suggestion.applicationId);
      if (app) {
        const suggestionInApp = app.suggestions.find(
          s => s._id.toString() === suggestionId
        );
        if (suggestionInApp) {
          suggestionInApp.voteCount = newVoteCount;
          await app.save();
        }
      }

      res.json({ success: true, voted: true, voteCount: newVoteCount });
      return;
    }
  } catch (error: unknown) {
    console.error('Error processing vote:', error);
    res.status(500).json({ success: false, message: 'Failed to process vote' });
  }
};

const uploadLogo = async (req: Request, res: Response): Promise<void> => {
  try {
    const logoFile = req.file;
    const appId = req.body.appId;
    const user = req.user as IUser;

    if (!logoFile) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const logoPath = `/uploads/${logoFile.filename}`;

    if (appId && appId !== 'temp') {
      const app = await Application.findOne({ _id: appId, user: user._id });

      if (app) {
        if (
          app.design?.logo &&
          app.design.logo.startsWith('/uploads/') &&
          app.design.logo !== logoPath
        ) {
          const fs = require('fs');
          const path = require('path');
          const oldLogoPath = path.join(
            __dirname,
            '../uploads',
            path.basename(app.design.logo)
          );

          if (fs.existsSync(oldLogoPath)) {
            try {
              fs.unlinkSync(oldLogoPath);
              console.log('✅ Old logo file deleted:', oldLogoPath);
            } catch (deleteError) {
              console.error('❌ Error deleting old logo:', deleteError);
            }
          }
        }

        app.design = { ...app.design, logo: logoPath };

        await app.save();
      }
    }

    res.json({
      success: true,
      logoPath: logoPath,
      message: 'Logo uploaded successfully',
    });
  } catch (error: unknown) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ success: false, message: 'Failed to upload logo' });
  }
};

const removeLogo = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const appId = req.params.appId;

    if (appId === 'temp') {
      const { logoPath } = req.body;
      if (logoPath && logoPath.startsWith('/uploads/')) {
        const fs = require('fs');
        const path = require('path');

        const filePath = path.join(
          __dirname,
          '../uploads',
          path.basename(logoPath)
        );

        const fileExists = fs.existsSync(filePath);

        if (fileExists) {
          try {
            fs.unlinkSync(filePath);
          } catch (deleteError) {
            console.error('❌ Error deleting temporary file:', deleteError);
          }
        }
      }

      res.json({
        success: true,
        message: 'Temporary logo removed successfully',
      });
      return;
    }

    const app = await Application.findOne({ _id: appId, user: user._id });

    console.log('Found app:', !!app);
    console.log('App design:', app?.design);
    console.log('Current logo path in DB:', app?.design?.logo);

    if (!app) {
      console.log('App not found or permission denied');
      res.status(404).json({
        success: false,
        message:
          'Application not found or you do not have permission to modify it',
      });
      return;
    }

    if (app.design?.logo && app.design.logo.startsWith('/uploads/')) {
      console.log('Logo exists in database, proceeding with file deletion...');
      const fs = require('fs');
      const path = require('path');

      console.log('__dirname:', __dirname);

      const logoPath = path.join(
        __dirname,
        '../uploads',
        path.basename(app.design.logo)
      );

      console.log('Constructed file path:', logoPath);
      console.log('Base filename:', path.basename(app.design.logo));

      const fileExists = fs.existsSync(logoPath);
      console.log('File exists on filesystem:', fileExists);

      if (fileExists) {
        try {
          fs.unlinkSync(logoPath);
          console.log('✅ Logo file deleted successfully:', logoPath);
        } catch (deleteError) {
          console.error('❌ Error deleting file:', deleteError);
        }
      } else {
        try {
          const uploadsDir = path.join(__dirname, '../uploads');
          const files = fs.readdirSync(uploadsDir);
          console.log('Files in uploads directory:', files);
        } catch (dirError) {
          console.error('Error reading uploads directory:', dirError);
        }
      }
    } else {
      console.log('No logo to delete or logo path invalid:', app.design?.logo);
    }

    console.log('Updating database to remove logo path...');
    app.design = { ...app.design, logo: '' };

    await app.save();
    console.log('✅ Database updated successfully - logo path cleared');

    console.log('=== REMOVE LOGO REQUEST END ===');
    res.json({ success: true, message: 'Logo removed successfully' });
  } catch (error: unknown) {
    console.error('❌ Error in removeLogo function:', error);
    res.status(500).json({ success: false, message: 'Failed to remove logo' });
  }
};

const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const suggestionId = req.params.suggestionId;
    const { text } = req.body;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required to add comments.',
      });
      return;
    }

    if (!text || text.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Comment text is required.',
      });
      return;
    }

    const suggestion = await Suggestion.findById(suggestionId);
    if (!suggestion) {
      res.status(404).json({
        success: false,
        message: 'Suggestion not found.',
      });
      return;
    }

    const newComment = {
      user: user._id as any,
      text: text.trim(),
      createdAt: new Date(),
    };

    suggestion.comments.push(newComment);
    await suggestion.save();

    res.json({
      success: true,
      message: 'Comment added successfully.',
      comment: newComment,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const deleteSuggestion = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { appId, suggestionId } = req.params;
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

    const suggestion = await Suggestion.findOne({
      _id: suggestionId,
      applicationId: appId,
    });

    if (!suggestion) {
      req.flash('error', 'Suggestion not found.');
      if (req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ error: 'Suggestion not found.' });
      }
      return res.status(404).redirect(`/apps/${appId}`);
    }

    await Vote.deleteMany({ suggestion: suggestionId });

    await Suggestion.findByIdAndDelete(suggestionId);

    await Application.findByIdAndUpdate(appId, {
      $pull: { suggestions: { _id: suggestionId } },
    });

    req.flash('success', 'Suggestion deleted successfully.');
    if (req.headers.accept?.includes('application/json')) {
      return res
        .status(200)
        .json({ message: 'Suggestion deleted successfully.' });
    }
    return res.status(200).redirect(`/apps/${appId}`);
  } catch (err: unknown) {
    console.error('❌ Error in deleteSuggestion:', err);
    req.flash('error', 'Failed to delete suggestion. Please try again.');
    if (
      req.headers.accept?.includes('application/json') ||
      req.headers['content-type']?.includes('application/json')
    ) {
      return res
        .status(500)
        .json({ error: 'Failed to delete suggestion. Please try again.' });
    }
    return res.status(500).redirect(`/apps/${req.params.appId}`);
  }
};

export default {
  getApp,
  getApps,
  getAddApp,
  postAddApp,
  getAddSuggestion,
  getSuggestionDetail,
  postAddSuggestion,
  getEditApp,
  putEditApp,
  deleteApp,
  voteOnSuggestion,
  uploadLogo,
  removeLogo,
  addComment,
  deleteSuggestion,
};

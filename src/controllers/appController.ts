import { Request, Response } from 'express';
import Application from '../models/Application';
import { IUser } from '../models/User';
import { AddAppDto } from '../dtos/app/add-app.dto';
import { AddSuggestionDto } from '../dtos/app/add-suggestion.dto';
import { EditAppDto } from '../dtos/app/edit-app.dto';
import { UpdateStatusDto } from '../dtos/app/update-status.dto';
import Suggestion from '../models/Suggestion';
import Vote from '../models/Vote';
import {
  getDefaultCategories,
  getCategoryByName,
} from '../utils/defaultCategories';

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

    // Determine sorting criteria based on sortType
    let suggestions;

    if (sortType === 'trending') {
      // Trending: most votes in last 2 weeks
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      suggestions = await Suggestion.aggregate([
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
            ],
            as: 'recentVotes',
          },
        },
        { $addFields: { recentVoteCount: { $size: '$recentVotes' } } },
        { $sort: { recentVoteCount: -1, createdAt: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        { $addFields: { userId: { $arrayElemAt: ['$userDetails', 0] } } },
        { $project: { userDetails: 0 } },
      ]);
    } else if (sortType === 'top') {
      // Top: most votes overall
      suggestions = await Suggestion.find({ applicationId: app._id })
        .populate('userId', 'firstName lastName username')
        .sort({ voteCount: -1, createdAt: -1 });
    } else {
      // New: most recent
      suggestions = await Suggestion.find({ applicationId: app._id })
        .populate('userId', 'firstName lastName username')
        .sort({ createdAt: -1 });
    }

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
      ...(suggestion.toObject ? suggestion.toObject() : suggestion),
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
        buttonColor: req.body.buttonColor,
        backgroundColor: req.body.backgroundColor,
        logo: req.body.logo || '',
      },
      customCategories: req.body.customCategories || [],
      defaultCategoriesEnabled: req.body.defaultCategoriesEnabled === 'true',
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

    // Get available categories based on app settings
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

    // Handle category selection
    let selectedCategory = req.body.category;
    if (!selectedCategory) {
      // Default to first available category if none selected
      const availableCategories = app.defaultCategoriesEnabled
        ? getDefaultCategories()
        : app.customCategories;
      selectedCategory = availableCategories[0] || {
        name: 'other',
        color: '#6b7280',
      };
    }

    const newSuggestion = new Suggestion({
      title: req.body.title,
      description: req.body.description,
      category: selectedCategory,
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

    // Update application fields
    app.name = req.body.name;
    app.description = req.body.description;
    app.design = {
      headerColor: req.body.headerColor,
      buttonColor: req.body.buttonColor,
      backgroundColor: req.body.backgroundColor,
      logo: req.body.logo || app.design?.logo || '',
    };

    // Update category-related fields
    if (req.body.customCategories !== undefined) {
      app.customCategories = req.body.customCategories;
    }

    // Handle checkbox: if not present in request body, it means unchecked (false)
    app.defaultCategoriesEnabled = req.body.defaultCategoriesEnabled === 'true';
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

      res.json({ success: true, voted: true, voteCount: suggestion.voteCount });
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
      res
        .status(404)
        .json({ success: false, message: 'Suggestion not found.' });
      return;
    }

    // Check if user is the owner of the application
    const app = await Application.findOne({
      _id: suggestion.applicationId,
      user: user._id,
    });

    if (!app) {
      res
        .status(403)
        .json({
          success: false,
          message:
            'You do not have permission to update this suggestion status.',
        });
      return;
    }

    suggestion.status = req.body.status as any;
    await suggestion.save();

    res
      .status(200)
      .json({
        success: true,
        message: 'Suggestion status has been updated successfully.',
      });
  } catch (error: unknown) {
    req.flash('error', 'Failed to update suggestion status. Please try again.');
    return res.status(500).redirect('/apps');
  }
};

// Logo upload/remove methods
const uploadLogo = async (req: Request, res: Response): Promise<void> => {
  try {
    const logoFile = req.file;
    const appId = req.body.appId; // Get app ID from request body
    const user = req.user as IUser;

    console.log('=== UPLOAD LOGO REQUEST START ===');
    console.log('App ID from body:', appId);
    console.log('User ID:', user?._id);

    if (!logoFile) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    // Return the relative path to the uploaded file
    const logoPath = `/uploads/${logoFile.filename}`;
    console.log('Logo uploaded successfully:', logoFile.originalname);
    console.log('Logo path:', logoPath);

    // If appId is provided, update the app's design in database
    if (appId && appId !== 'temp') {
      console.log('Updating app design with new logo...');

      // Find the application and verify ownership
      const app = await Application.findOne({ _id: appId, user: user._id });

      if (app) {
        console.log('App found, updating logo in database...');
        // Remove old logo file if it exists
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

        // Update app design with new logo
        app.design = { ...app.design, logo: logoPath };

        await app.save();
        console.log('✅ App design updated with new logo');
      } else {
        console.log('⚠️ App not found or permission denied');
      }
    } else {
      console.log('No app ID provided - treating as temporary upload');
    }

    console.log('=== UPLOAD LOGO REQUEST END ===');
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
    console.log('=== REMOVE LOGO REQUEST START ===');
    const user = req.user as IUser;
    const appId = req.params.appId;

    console.log('User ID:', user?._id);
    console.log('App ID from params:', appId);

    // Handle temporary logo cleanup (from add-app.ejs)
    if (appId === 'temp') {
      console.log('Handling temporary logo cleanup...');
      const { logoPath } = req.body;
      console.log('Logo path to delete:', logoPath);

      if (logoPath && logoPath.startsWith('/uploads/')) {
        const fs = require('fs');
        const path = require('path');

        console.log('__dirname:', __dirname);

        const filePath = path.join(
          __dirname,
          '../uploads',
          path.basename(logoPath)
        );

        console.log('Constructed file path:', filePath);

        const fileExists = fs.existsSync(filePath);
        console.log('File exists on filesystem:', fileExists);

        if (fileExists) {
          try {
            fs.unlinkSync(filePath);
            console.log(
              '✅ Temporary logo file deleted successfully:',
              filePath
            );
          } catch (deleteError) {
            console.error('❌ Error deleting temporary file:', deleteError);
          }
        } else {
          console.log('⚠️ Temporary logo file not found at path:', filePath);
        }
      }

      console.log('=== TEMPORARY LOGO CLEANUP END ===');
      res.json({
        success: true,
        message: 'Temporary logo removed successfully',
      });
      return;
    }

    // Handle permanent logo removal (from edit-app.ejs)
    console.log('Handling permanent logo removal...');

    // Find the application and verify ownership
    const app = await Application.findOne({ _id: appId, user: user._id });

    console.log('Found app:', !!app);
    console.log('App design:', app?.design);
    console.log('Current logo path in DB:', app?.design?.logo);

    if (!app) {
      console.log('App not found or permission denied');
      res
        .status(404)
        .json({
          success: false,
          message:
            'Application not found or you do not have permission to modify it',
        });
      return;
    }

    // Remove logo from filesystem if it exists
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
        console.log('⚠️ Logo file not found at path:', logoPath);
        // List files in uploads directory for debugging
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

    // Update application to remove logo
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
  uploadLogo,
  removeLogo,
};

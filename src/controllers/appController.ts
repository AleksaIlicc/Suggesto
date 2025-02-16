import { Request, Response } from 'express';
import Application from '../models/Application';
import { IUser } from '../models/User';
import { AddAppDto } from '../dtos/app/add-app.dto';
import { AddSuggestionDto } from '../dtos/app/add-suggestion.dto';
import Suggestion from '../models/Suggestion';

const getApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;

    const app = await Application.findOne({
      _id: req.params.id,
    }).populate('user');

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/');
    }

    res.render('pages/apps/app', {
      app,
      isOwner: user && user._id.toString() === app.user._id.toString(),
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
      headerColor: req.body.headerColor,
      buttonColor: req.body.buttonColor,
      user: user._id,
    });

    await newApp.save();

    req.flash('success', 'Application has been created successfully.');
    return res.status(201).redirect('/apps/add-app');
  } catch (error: unknown) {
    req.flash('error', 'Failed to create application. Please try again.');
    return res.status(500).redirect('/apps/add-app');
  }
};

const getAddSuggestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const _id = req.params.id;

    const app = await Application.findOne({
      _id: _id,
      user: user._id,
    });

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/');
    }

    res.render('pages/apps/add-suggestion', { appId: _id });
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
    const user = req.user as IUser;

    const app = await Application.findOne({
      _id: req.params.id,
    });

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/apps/my-apps');
    }

    const newAppSuggestion = new Suggestion({
      title: req.body.title,
      description: req.body.description,
      applicationId: req.params.id,
      userId: user._id,
    });

    await newAppSuggestion.save();

    app.suggestions.push({
      _id: newAppSuggestion._id,
      title: req.body.title,
      description: req.body.description,
      count: app.suggestions.length + 1,
    });

    await app.save();

    req.flash(
      'success',
      'Application suggestion has been created successfully.'
    );
    return res.status(201).redirect(`/apps/${req.params.id}/add-suggestion`);
  } catch (error: unknown) {
    req.flash(
      'error',
      'Failed to create application suggestion. Please try again.'
    );
    return res.status(500).redirect('/apps/add');
  }
};

export default {
  getApp,
  getApps,
  getAddApp,
  postAddApp,
  getAddSuggestion,
  postAddSuggestion,
};

import { Request, Response } from 'express';
import Application from '../models/Application';
import User, { IUser } from '../models/User';
import { AddAppDto } from '../dtos/app/add-app.dto';

const getApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const _id = req.params.id;

    const app = await Application.findOne({
      _id,
    });

    if (!app) {
      req.flash('error', 'Application not found.');
      return res.status(404).redirect('/');
    }

    res.render('pages/apps/app', { app });
  } catch (err: unknown) {
    req.flash('error', 'Failed to fetch application. Please try again.');
    return res.status(500).redirect('/');
  }
};

const getApps = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;

    const apps = await Application.find({
      userId: user._id,
    });

    console.log(apps);

    res.render('pages/apps/my-apps', { apps });
  } catch (err: unknown) {
    req.flash('error', 'Failed to fetch your applications. Please try again.');
    return res.status(500).redirect('/');
  }
};

const getAddApp = async (req: Request, res: Response): Promise<void> => {
  try {
    res.render('pages/apps/add-app');
  } catch (err: unknown) {
    req.flash(
      'error',
      'Unable to load application creation form. Please try again.'
    );
    return res.status(500).redirect('/');
  }
};

const postAddApp = async (
  req: Request<{}, {}, AddAppDto>,
  res: Response
): Promise<void> => {
  try {
    const existingUser = await User.findOne({
      _id: req.body.userId,
    });

    if (!existingUser) {
      req.flash('error', 'User not found.');
      return res.status(404).redirect('/app/add');
    }

    const newApp = new Application({
      name: req.body.name,
      description: req.body.description,
      headerColor: req.body.headerColor,
      buttonColor: req.body.buttonColor,
      userId: req.body.userId,
    });

    await newApp.save();

    req.flash('success', 'Application has been created successfully.');
    return res.status(201).redirect('/app/add');
  } catch (error: unknown) {
    req.flash('error', 'Failed to create application. Please try again.');
    return res.status(500).redirect('/app/add');
  }
};

export default {
  getApp,
  getApps,
  getAddApp,
  postAddApp,
};

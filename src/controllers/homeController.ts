import { Request, Response } from 'express';
import Application from '../models/Application';
import { IUser } from '../models/User';

const getHome = async (req: Request, res: Response): Promise<void> => {
  try {
    let hasApplications = false;
    const user = req.user as IUser;

    if (user) {
      const appCount = await Application.countDocuments({ user: user._id });
      hasApplications = appCount > 0;
    }

    res.render('home', { hasApplications });
  } catch (err: unknown) {
    console.error('Error rendering home page:', err);
    res.render('home', { hasApplications: false });
  }
};

export default {
  getHome,
};

import { Request, Response } from 'express';

const getHome = async (_req: Request, res: Response): Promise<void> => {
  res.render('home');
};

const getApp = async (_req: Request, res: Response): Promise<void> => {
  res.render('app');
};

export default {
  getHome,
  getApp,
};

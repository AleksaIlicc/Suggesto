import { Request, Response } from 'express';

const getHome = async (_req: Request, res: Response): Promise<void> => {
  res.render('home');
};

export default {
  getHome,
};

import { Request, Response } from 'express';

const getSignup = async (req: Request, res: Response): Promise<void> => {
  res.render('pages/auth/signup');
};

const getLogin = async (req: Request, res: Response): Promise<void> => {
  res.render('pages/auth/login');
};

export default {
  getLogin,
  getSignup,
};

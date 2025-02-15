import { NextFunction, Request, Response } from 'express';
import { CreateUserDto } from '../dtos/auth/create-user.dto';
import User, { IUser } from '../models/User';
import bcrypt from 'bcrypt';
import { LoginUserDto } from '../dtos/auth/login-user.dto';
import passport from 'passport';

const getRegister = async (_req: Request, res: Response): Promise<void> => {
  res.render('pages/auth/register');
};

const getLogin = async (_req: Request, res: Response): Promise<void> => {
  res.render('pages/auth/login');
};

const postLogin = async (
  req: Request<{}, {}, LoginUserDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findOne({
      email: req.body.email,
    });

    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.status(403).redirect('/auth/login');
    }

    const isMatched = await bcrypt.compare(req.body.password, user.password);

    if (!isMatched) {
      req.flash('error', 'Invalid email or password.');
      return res.status(403).redirect('/auth/login');
    }

    passport.authenticate(
      'local',
      (
        err: Error | null,
        user: Express.User | null,
        info: { message: string }
      ) => {
        if (err) {
          req.flash('error', info?.message || 'An error occurred.');
          return res.status(500).redirect('/auth/login');
        }

        if (!user) {
          req.flash('error', info?.message || 'Invalid email or password.');
          return res.status(403).redirect('/auth/login');
        }

        req.logIn(user, (loginErr: unknown) => {
          if (loginErr) {
            req.flash('error', info?.message || 'Login failed.');
            return next(loginErr);
          }

          req.flash(
            'success',
            info?.message || 'You have successfully logged in.'
          );

          return res.status(200).redirect('/');
        });
      }
    )(req, res, next);
  } catch (error: unknown) {
    console.error(error);
    req.flash('error', 'Login failed. Please try again.');
    return res.status(500).redirect('/auth/login');
  }
};

const postRegister = async (
  req: Request<{}, {}, CreateUserDto>,
  res: Response
): Promise<void> => {
  try {
    const existingUser = await User.findOne({
      $or: [{ email: req.body.email }, { username: req.body.username }],
    });

    if (existingUser?.email === req.body.email) {
      req.flash('error', 'A user with this email address already exists.');
      return res.status(409).redirect('/auth/register');
    }

    if (existingUser?.username === req.body.username) {
      req.flash('error', 'A user with this username already exists.');
      return res.status(409).redirect('/auth/register');
    }

    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
    });

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(req.body.password, salt);

    await newUser.save();

    req.flash('success', 'You have successfully registered.');
    return res.status(201).redirect('/auth/login');
  } catch (error: unknown) {
    req.flash('error', 'An error occurred during registration.');
    return res.status(500).redirect('/auth/register');
  }
};

const getLogout = async (req: Request, res: Response): Promise<void> => {
  req.logOut(async err => {
    if (err) {
      req.flash('error', 'An error occurred during logout.');
      return res.status(500).redirect('/');
    }
  });

  req.flash('success', 'You have successfully logged out.');
  return res.status(201).redirect('/');
};

export default {
  getLogin,
  getRegister,
  getLogout,
  postRegister,
  postLogin,
};

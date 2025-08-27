import { NextFunction, Request, Response } from 'express';
import { CreateUserDto } from '../dtos/auth/create-user.dto';
import { ForgotPasswordDto } from '../dtos/auth/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/auth/reset-password.dto';
import User from '../models/User';
import bcrypt from 'bcrypt';
import { LoginUserDto } from '../dtos/auth/login-user.dto';
import passport from 'passport';
import { generateResetToken, hashToken } from '../utils/crypto';
import sendEmail from '../utils/sendEmail';

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
  return res.status(200).redirect('/');
};

const getForgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.render('pages/auth/forgot-password');
};

const postForgotPassword = async (
  req: Request<{}, {}, ForgotPasswordDto>,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      req.flash('error', 'No account found with that email address.');
      return res.status(404).redirect('/auth/forgot-password');
    }

    const resetToken = generateResetToken();
    const hashedToken = hashToken(resetToken);

    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 3600000);
    await user.save();

    const resetUrl = `${process.env.BASE_URL}/auth/reset-password?token=${resetToken}&userId=${user._id}`;

    const sendResult = await sendEmail.sendForgotPassword(
      user.email,
      resetUrl,
      user.firstName
    );

    if (!sendResult.success) {
      req.flash(
        'error',
        'Failed to send password reset email. Please try again.'
      );
      return res.status(500).redirect('/auth/forgot-password');
    }

    req.flash(
      'success',
      'Password reset instructions have been sent to your email.'
    );

    return res.status(200).redirect('/auth/login');
  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    return res.status(500).redirect('/auth/forgot-password');
  }
};

const getResetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, userId } = req.query;

  if (!token || !userId) {
    req.flash('error', 'Invalid password reset link.');
    return res.status(400).redirect('/auth/login');
  }

  try {
    const hashedToken = hashToken(token as string);
    const user = await User.findOne({
      _id: userId,
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      req.flash('error', 'Password reset link is invalid or has expired.');
      return res.status(400).redirect('/auth/login');
    }

    res.render('pages/auth/reset-password', { token, userId });
  } catch (error: unknown) {
    console.error('Reset password error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    return res.status(500).redirect('/auth/login');
  }
};

const postResetPassword = async (
  req: Request<{}, {}, ResetPasswordDto>,
  res: Response
): Promise<void> => {
  try {
    const { token, userId, password } = req.body;

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      _id: userId,
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      req.flash('error', 'Password reset link is invalid or has expired.');
      return res.status(400).redirect('/auth/login');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    const sendResult = await sendEmail.sendResetConfirmation(
      user.email,
      user.firstName
    );

    if (!sendResult.success) {
      req.flash(
        'error',
        'Failed to send confirmation email. Please try again.'
      );
      return res.status(500).redirect('/auth/reset-password');
    }

    req.flash(
      'success',
      'Your password has been reset successfully. You can now log in.'
    );

    return res.status(200).redirect('/auth/login');
  } catch (error: unknown) {
    console.error('Reset password error:', error);
    req.flash(
      'error',
      'An error occurred while resetting your password. Please try again.'
    );
    return res.status(500).redirect('/auth/reset-password');
  }
};

export default {
  getLogin,
  getRegister,
  getLogout,
  getForgotPassword,
  getResetPassword,
  postRegister,
  postLogin,
  postForgotPassword,
  postResetPassword,
};

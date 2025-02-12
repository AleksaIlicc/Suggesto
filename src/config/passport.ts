import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import User, { IUser } from '../models/User';

const init = (passport: passport.PassportStatic) => {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (
        email: string,
        password: string,
        done: (
          error: unknown,
          user?: IUser | null,
          info?: { message: string }
        ) => void
      ) => {
        try {
          const user = await User.findOne({ email });

          if (!user) {
            return done(null, null, { message: 'User not found!' });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, null, {
              message: 'Email or password is incorrect!',
            });
          }

          const userWithoutPassword = user.toObject();

          delete userWithoutPassword.password;

          return done(null, userWithoutPassword, {
            message: 'You have successfully logged in.',
          });
        } catch (err: unknown) {
          return done(null, null, { message: 'Database Error. Try Again!' });
        }
      }
    )
  );

  passport.serializeUser(
    (user: IUser, done: (err: unknown, id?: string) => void) => {
      done(null, user._id);
    }
  );

  passport.deserializeUser(
    async (id: string, done: (err: unknown, user?: IUser | null) => void) => {
      try {
        const user = await User.findOne({ _id: id });

        if (user) {
          const userWithoutPassword = user.toObject();
          delete userWithoutPassword.password;
          done(null, userWithoutPassword);
        } else {
          done(null, null);
        }
      } catch (err: unknown) {
        done(err);
      }
    }
  );
};

export default init;

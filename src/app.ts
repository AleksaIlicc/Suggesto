import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import helmet from 'helmet';
import flash from 'express-flash';
import expressSession from 'express-session';
import initPassport from './config/passport';
import passport from 'passport';
import moment from 'moment-timezone';
import compression from 'compression';
import homeRoutes from './routes/homeRoutes';
import authRoutes from './routes/authRoutes';
import connectToDatabase from './config/datasource';

const main = async (): Promise<void> => {
  try {
    // Connecting to MongoDB
    await connectToDatabase();

    // App Initialization
    const app = express();
    const port = process.env.PORT || 3000;

    // Compression
    app.use(compression());

    // Security
    helmet({
      contentSecurityPolicy: {},
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    });
    app.use(hpp());
    app.use(
      cors({
        origin: ['http://localhost:3000'],
        credentials: true,
      })
    );
    app.use(cookieParser());

    // Template Engine & Assets Settings
    app.set('view engine', 'ejs');
    app.set('trust proxy', 1);
    app.set('views', join(__dirname, 'views'));
    app.use(express.static(join(__dirname, '/public')));

    // Body settings & flush messages & sessions
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(flash());
    app.use(
      expressSession({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: true,
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          httpOnly: true,
        },
      })
    );

    // Initialization of Passport
    initPassport(passport);
    app.use(passport.initialize());
    app.use(passport.session());

    // Rest middlewares
    app.use(
      async (
        req: Request,
        res: Response,
        next: NextFunction
      ): Promise<void> => {
        res.locals.session = req.session;
        res.locals.user = req.user;
        res.locals.moment = moment;

        next();
      }
    );

    // Initialization of Routes
    app.use('/', homeRoutes);
    app.use('/auth', authRoutes);

    // Run the application

    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
    });
  } catch (error: unknown) {
    console.error('Database connection error:', error);
    process.exit();
  }
};

main();

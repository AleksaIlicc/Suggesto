// import passport from 'passport';
// import { Strategy as LocalStrategy } from 'passport-local';
// import bcrypt from 'bcrypt';

// const init = (passport: passport.PassportStatic) => {
//   passport.use(
//     new LocalStrategy(
//       { usernameField: 'email' },
//       async (
//         email: string,
//         password: string,
//         done: (error: unknown, user?: User, info?: { message: string }) => void
//       ) => {
//         try {
//           const user = await MysqlDataSource.getRepository(User).findOne({
//             where: {
//               email,
//               isDeleted: false,
//             },
//           });

//           if (!user) {
//             return done(null, null, { message: 'User not found!' });
//           }

//           if (!bcrypt.compareSync(password, user.password)) {
//             return done(null, null, {
//               message: 'Email or password is incorrect!',
//             });
//           }

//           delete user.password;

//           return done(null, user, {
//             message: 'You have successfully logged in.',
//           });
//         } catch (err: unknown) {
//           return done(null, null, { message: 'Database Error. Try Again!' });
//         }
//       }
//     )
//   );

//   passport.serializeUser(
//     (user: User, done: (err: unknown, id?: string) => void) => {
//       done(null, user.id);
//     }
//   );

//   passport.deserializeUser(
//     async (id: string, done: (err: unknown, user?: User) => void) => {
//       try {
//         const userData = await redisClient.get(`user:${id}`);
//         let user: User = null;

//         if (userData) {
//           user = JSON.parse(userData);
//         } else {
//           user = await MysqlDataSource.getRepository(User).findOne({
//             where: {
//               id,
//               isDeleted: false,
//             },
//           });

//           await redisClient.setEx(`user:${id}`, 3600, JSON.stringify(user));
//         }
//         done(null, user);
//       } catch (err: unknown) {
//         done(err);
//       }
//     }
//   );
// };

// export default init;

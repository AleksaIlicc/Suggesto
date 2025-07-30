import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }
  
  req.flash('error', 'You must be logged in to access this page.');
  res.redirect('/auth/login');
}

export function requireOwnership(req: Request, res: Response, next: NextFunction): void {
  // This middleware should be used after requireAuth
  // and after loading the resource to check ownership
  next();
}

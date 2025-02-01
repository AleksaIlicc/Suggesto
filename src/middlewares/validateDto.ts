import { plainToInstance, ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';

export function validateDto<T>(
  dtoClass: ClassConstructor<T>,
  source: 'body' | 'query' = 'body'
) {
  return (
    req: Request & { [key in typeof source]: T },
    res: Response,
    next: NextFunction
  ) => {
    const dtoInstance = plainToInstance(dtoClass, req[source]) as T;

    validate(dtoInstance as object, { stopAtFirstError: true }).then(errors => {
      if (errors.length > 0) {
        const firstError = errors[0];
        const firstErrorMessage = Object.values(
          firstError.constraints || {}
        )[0];
        req.flash('error', firstErrorMessage);
        return source === 'body'
          ? res.status(400).redirect(req.originalUrl)
          : res.status(400).redirect('/');
      } else {
        req[source] = dtoInstance;
        next();
      }
    });
  };
}

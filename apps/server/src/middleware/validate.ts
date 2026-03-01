import { RequestHandler } from "express";
import { AnyZodObject, ZodError } from "zod";

import { ValidationError } from "../utils/errors";

export function validate(
  schema: AnyZodObject,
  source: "body" | "query" | "params" = "body",
): RequestHandler {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!errors[path]) errors[path] = [];
          errors[path].push(err.message);
        });
        next(new ValidationError(errors));
      } else {
        next(error);
      }
    }
  };
}

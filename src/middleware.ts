import { defineMiddleware } from "astro:middleware";
import { getSessionAndUserByToken } from "./lib/auth";

const SESSION_COOKIE = "orboro_session";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  context.locals.session = null;

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token && context.locals.runtime?.env?.DB) {
    try {
      const { session, user } = await getSessionAndUserByToken(context.locals, token);
      context.locals.session = session;
      context.locals.user = user;
    } catch {
      context.cookies.delete(SESSION_COOKIE, { path: "/" });
    }
  }

  return next();
});

export { SESSION_COOKIE };

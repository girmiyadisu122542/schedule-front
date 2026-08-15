/**
 * HTTP status codes the client reacts to.
 *
 * 401 and 403 are NOT interchangeable, and treating them as one is what made
 * the app sign users out whenever they touched something they lacked a
 * permission for:
 *
 * - 401 Unauthorized — no valid session. Clear it and return to sign in.
 * - 403 Forbidden — the session is valid, this one action is not allowed. Tell
 *   the user and leave them where they are.
 */
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_FORBIDDEN = 403;
export const HTTP_UNPROCESSABLE_ENTITY = 422;
export const HTTP_NOT_FOUND = 404;
export const HTTP_SERVER_ERROR = 500;

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { generateSessionToken, verifyAuthenticationToken } from "../lib/auth";
import { AuthTokenSchema, UserSchema } from "../lib/cosmos";

/**
 * GET: verify auth token (magic link from email) and provide session cookie for user
 * TODO: remove auth token from database upon successful auth (to make it single-use only)
 *
 * @param context Function context
 * @param req HTTP request object
 * @param authenticationToken Auth token document from search params (input binding)
 * @param userDocument User document from search params supplied email (input binding)
 */
const httpTrigger: AzureFunction = function (
  context: Context,
  req: HttpRequest,
  authenticationToken: AuthTokenSchema,
  userDocument: UserSchema
): void {
  // email not validated in function code since it is used as id when querying for auth token in db
  const { token, email } = req.query as { token: string; email: string };

  // fail if no auth token document from database or token mismatch
  if (!authenticationToken || authenticationToken.token !== token) {
    context.res = {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        message: "Invalid authentication token",
      },
    };
    return;
  }

  try {
    verifyAuthenticationToken(token);
  } catch (err: unknown) {
    context.res = {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        message: "Invalid authentication token",
      },
    };
    return;
  }

  // Create or update user document
  const updatedUserDocument = JSON.stringify({
    ...userDocument,
    // use email as id for clarity
    // ideally this would be a cuid/uuid
    id: email,
    // supply default empty array for user schema field
    searchQueries: [],
  });
  context.bindings.updatedUserDocument = updatedUserDocument;

  const isLocalhost = req.headers["origin"] === "https://localhost:3000";
  context.res = {
    status: 200,
    body: updatedUserDocument,
    headers: {
      "Content-Type": "application/json",
    },
    cookies: [
      {
        domain: process.env["SessionCookieDomain"],
        name: process.env["SessionCookieName"],
        value: generateSessionToken(email),
        httpOnly: true,
        maxAge: process.env["SessionCookieMaxAge"],
        secure: process.env["NODE_ENV"] !== "local",
        // samesite must be none for localhost session to work
        sameSite: isLocalhost ? "None" : "Strict",
      },
    ],
  };
  context.done();
};

export default httpTrigger;

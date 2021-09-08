import { Context, HttpRequest } from "@azure/functions";
import { parse } from "cookie";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { getUser, UserSchema } from "./cosmos";
import {
  internalServerErrorResponse,
  notAuthenticatedErrorResponse,
} from "./http";

/**
 * @param email Email
 * @returns Signed auth token (magic login token)
 */
export const generateAuthenticationToken = (email: string): string | null => {
  if (!process.env["AuthenticationTokenSecret"]) {
    return null;
  }
  const authenticationTokenSecret = process.env["AuthenticationTokenSecret"];
  return sign({ email }, authenticationTokenSecret, {
    // jwt has 900s expiration time, but the db also has 900s ttl to make sure the tokens die
    expiresIn: "900s",
  });
};

/**
 * @param email Email
 * @returns Signed session token
 */
export const generateSessionToken = (email: string): string => {
  if (!process.env["SessionTokenSecret"]) {
    throw new Error("Invalid server error");
  }
  const sessionTokenSecret = process.env["SessionTokenSecret"];
  return sign({ email }, sessionTokenSecret, { expiresIn: "31d" });
};

/**
 * @param token Token to verify
 * @returns Verified and decrypted auth token (magic login token)
 */
export const verifyAuthenticationToken = (
  token: string
): JwtPayload | string => {
  if (!process.env["AuthenticationTokenSecret"]) {
    throw new Error("Invalid server error");
  }
  const authenticationTokenSecret = process.env["AuthenticationTokenSecret"];
  return verify(token, authenticationTokenSecret);
};

/**
 * Verifies session token from request cookies & returns authenticated user
 * if successful, otherwise returns null and sets a HTTP 401 response to the
 * function context. Do not keep processing the function if the result is null.
 *
 * @param context Function context
 * @param req HTTP request object
 * @returns
 */
export const verifySessionToken = async (
  context: Context,
  req: HttpRequest
): Promise<UserSchema | null> => {
  if (!process.env["SessionCookieName"] || !process.env["SessionTokenSecret"]) {
    internalServerErrorResponse(context);
    return null;
  }

  try {
    const session: string = parse(req.headers["cookie"] || "")?.[
      process.env["SessionCookieName"]
    ];
    const sessionTokenSecret = process.env["SessionTokenSecret"];
    const email = (
      verify(session, sessionTokenSecret) as JwtPayload & { email: string }
    )["email"];
    const user = await getUser(email);
    if (!user) {
      throw new Error("No user found");
    }
    return user;
  } catch (err: unknown) {
    notAuthenticatedErrorResponse(context);
    return null;
  }
};

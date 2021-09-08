import { HTTPMethod } from "@azure/cosmos";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { verifySessionToken } from "../lib/auth";

/**
 * GET: get currently active user session from request cookies.
 * DELETE: remove currently active user session (clear cookie)
 *
 * @param context Function context
 * @param req Request
 */
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const user = await verifySessionToken(context, req);
  if (!user) {
    return;
  }

  if (req.method === HTTPMethod.get) {
    context.res = {
      status: 200,
      body: {
        ...user,
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
  } else if (req.method === HTTPMethod.delete) {
    const isLocalhost = req.headers["origin"] === "https://localhost:3000";

    context.res = {
      status: 204,
      cookies: [
        {
          domain: process.env["SessionCookieDomain"],
          name: process.env["SessionCookieName"],
          httpOnly: true,
          maxAge: 0,
          secure: process.env["NODE_ENV"] !== "local",
          // samesite must be none for localhost session to work
          sameSite: isLocalhost ? "None" : "Strict",
        },
      ],
    };
  }
};

export default httpTrigger;

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { validate } from "email-validator";
import { generateAuthenticationToken } from "../lib/auth";
import { sendEmail } from "../lib/email";
import { internalServerErrorResponse } from "../lib/http";
import { VERIFY_TOKEN_TEMPLATE } from "./verify-token-template";

/**
 * POST: request auth token (magic link) email
 *
 * @param context Function context
 * @param req HTTP request object
 */
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (!req.body) {
    context.res = {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        message: "No email address provided",
      },
    };
    return;
  }

  const email = (req.body as Record<string, string>)["email"];

  // fail fast for invalid email
  if (!validate(email)) {
    context.res = {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        message: "Invalid email address",
      },
    };
    return;
  }

  if (
    !process.env["VerifyAuthenticationTokenEndpoint"] ||
    !process.env["SendGridFromAddress"]
  ) {
    internalServerErrorResponse(context);
    return;
  }

  // generate auth token and save it via output binding
  const token = generateAuthenticationToken(email);
  if (!token) {
    internalServerErrorResponse(context);
    return;
  }

  context.bindings.outputDocument = JSON.stringify({
    // use email as id to have only one valid auth token per email at a time
    // the document is upserted so any existing stored token is replaced
    id: email,
    token,
  });

  const verifyUrl = new URL(process.env["VerifyAuthenticationTokenEndpoint"]);
  verifyUrl.searchParams.append("email", email);
  verifyUrl.searchParams.append("token", token);

  await sendEmail([
    {
      from: process.env["SendGridFromAddress"],
      to: email,
      subject: "Log in to Xenprowler",
      html: VERIFY_TOKEN_TEMPLATE.replace(
        /\[\[LOGIN_LINK\]\]/g,
        verifyUrl.toString()
      ),
    },
  ]);

  context.res = {
    status: 200,
  };
};

export default httpTrigger;

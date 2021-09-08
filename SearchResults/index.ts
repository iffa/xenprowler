import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { verifySessionToken } from "../lib/auth";
import { getResultsHistoryForUser } from "../lib/cosmos";

/**
 * GET: get search results history
 *
 * @param context Function context
 * @param req HTTP request object
 */
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const user = await verifySessionToken(context, req);
  if (!user) {
    return;
  }

  const results = await getResultsHistoryForUser(user.id);

  context.res = {
    status: 200,
    body: results,
    headers: {
      "Content-Type": "application/json",
    },
  };
};

export default httpTrigger;

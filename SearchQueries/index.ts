import { HTTPMethod } from "@azure/cosmos";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { verifySessionToken } from "../lib/auth";

/**
 * GET: get current search queries for user
 * PATCH: update search queries for user
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

  let searchQueries: string[];
  if (req.method === HTTPMethod.patch) {
    if (!req.body) {
      context.res = {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: "No search queries provided",
        },
      };
      return;
    }

    const searchQueriesParam: string[] = (
      req.body as { searchQueries: string[] }
    ).searchQueries;
    if (!Array.isArray(searchQueriesParam)) {
      context.res = {
        status: 400,
      };
      return;
    }

    searchQueries = searchQueriesParam.filter((x) => !!x);

    // Create or update user document with new search queries
    context.bindings.updatedUserDocument = JSON.stringify({
      ...user,
      searchQueries,
    });
  } else {
    searchQueries = user.searchQueries || [];
  }

  context.res = {
    status: 200,
    body: {
      searchQueries,
    },
    headers: {
      "Content-Type": "application/json",
    },
  };
};

export default httpTrigger;

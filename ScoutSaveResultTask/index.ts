import { AzureFunction, Context } from "@azure/functions";
import { v4 } from "uuid";
import { getResultsHistoryForUser } from "../lib/cosmos";
import { MarketListing } from "../lib/scraper";
import { SearchResults } from "../ScoutFuzzySearchTask";

/**
 * Activity that saves search results to the database. Filters duplicates.
 *
 * @param context Function context
 */
const activityFunction: AzureFunction = async function (
  context: Context
): Promise<void> {
  const { id, results } = context.bindings.input as SearchResults;

  const resultHistory: MarketListing[] = (
    await getResultsHistoryForUser(id)
  ).map((result) => result.item);

  const filteredResults = results.filter((result) => {
    if (resultHistory.find((x) => x.link === result.item.link)) {
      return false;
    }
    return true;
  });

  if (filteredResults.length === 0) {
    return;
  }

  context.bindings.resultDocument = JSON.stringify({
    id: v4(),
    userId: id,
    results: filteredResults,
  });
};

export default activityFunction;

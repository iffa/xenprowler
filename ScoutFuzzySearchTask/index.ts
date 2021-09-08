import { AzureFunction, Context } from "@azure/functions";
import Fuse from "fuse.js";
import { UserIdWithSearchQueries } from "../lib/cosmos";
import { MarketListing } from "../lib/scraper";

export type SearchResult = Fuse.FuseResult<MarketListing> & {
  query: string;
};

export type SearchResults = {
  id: string;
  results: SearchResult[];
};

/**
 * Activity that gets new market listings and performs fuzzy search for results.
 *
 * @param context Function context
 * @returns Search results
 */
const activityFunction: AzureFunction = function (
  context: Context
): Promise<SearchResults> {
  const { user, marketListings } = context.bindings.input as {
    user: UserIdWithSearchQueries;
    marketListings: MarketListing[];
  };

  const fuse = new Fuse(marketListings, {
    includeScore: true,
    findAllMatches: true,
    keys: ["title", "link"],
    threshold: 0.6,
  });

  const results: SearchResult[][] = [];
  for (const query of user.searchQueries) {
    results.push(
      fuse.search(query).map((result) => {
        return {
          ...result,
          query,
        };
      })
    );
  }

  const cleanedResult = results
    .flat()
    // A score of 0 indicates a perfect match, while a score of 1 indicates a complete mismatch.
    .filter((result) => (result.score || 0.0) <= 0.2);

  return Promise.resolve({
    id: user.id,
    results: cleanedResult,
  });
};

export default activityFunction;

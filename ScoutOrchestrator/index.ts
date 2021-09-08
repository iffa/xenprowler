import * as df from "durable-functions";
import { Task } from "durable-functions/lib/src/classes";
import { UserIdWithSearchQueries } from "../lib/cosmos";
import { MarketListing } from "../lib/scraper";
import { SearchResults } from "../ScoutFuzzySearchTask";

/**
 * Orchestrator for search functionality.
 */
const orchestrator = df.orchestrator(function* (context) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const activeUsers: UserIdWithSearchQueries[] = yield context.df.callActivity(
    "ScoutGetSearchQueriesTask"
  );

  // no active search queries, stop processing
  if (activeUsers.length === 0) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const marketListings: MarketListing[] = yield context.df.callActivity(
    "ScoutGetMarketListings"
  );

  const fuzzySearchTasks: Task[] = [];
  for (const user of activeUsers) {
    fuzzySearchTasks.push(
      context.df.callActivity("ScoutFuzzySearchTask", { user, marketListings })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const results: SearchResults[] = yield context.df.Task.all(fuzzySearchTasks);
  const filteredResults = results.filter((x) => x.results.length > 0);

  // no search results, stop processing
  if (filteredResults.length === 0) {
    return;
  }

  const saveTasks: Task[] = [];
  for (const result of filteredResults) {
    saveTasks.push(context.df.callActivity("ScoutSaveResultTask", result));
  }

  yield context.df.Task.all(saveTasks);
});

export default orchestrator;

import { AzureFunction } from "@azure/functions";
import {
  getSearchQueriesForUsers,
  UserIdWithSearchQueries,
} from "../lib/cosmos";
/**
 * Activity that returns active search queries for users.
 *
 * @param _context Function context
 * @returns Array of id/searchQueries objects (stripped user document data)
 */
const activityFunction: AzureFunction = async function (): Promise<
  UserIdWithSearchQueries[]
> {
  return await getSearchQueriesForUsers();
};

export default activityFunction;

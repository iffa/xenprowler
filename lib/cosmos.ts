import { CosmosClient, Resource, SqlQuerySpec } from "@azure/cosmos";
import { SearchResult } from "../ScoutFuzzySearchTask";

// If connecting to the Cosmos DB Emulator, disable TLS verification for your node process:
if (process.env.NODE_ENV === "local") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const client = new CosmosClient(process.env["CosmosDbConnectionString"] || "");
const databaseId = "xenprowler";
const usersContainerId = "users";
const resultsContainerId = "results";

export interface AuthTokenSchema extends Resource {
  token: string;
}

export interface UserSchema extends Resource {
  searchQueries: string[];
}

export interface ResultSchema extends Resource {
  userId: string;
  results: SearchResult[];
}

export type UserIdWithSearchQueries = Pick<UserSchema, "id" | "searchQueries">;

export const getUser = async (
  email: string
): Promise<UserSchema | undefined> => {
  const user = await client
    .database(databaseId)
    .container(usersContainerId)
    .item(email, email)
    .read<UserSchema>();
  return user.resource;
};

export const getSearchQueriesForUsers = async (): Promise<
  UserIdWithSearchQueries[]
> => {
  const sqlQuery: SqlQuerySpec = {
    query:
      "SELECT c.id, c.searchQueries FROM c WHERE ARRAY_LENGTH(c.searchQueries) > 0",
  };
  const { resources } = await client
    .database(databaseId)
    .container(usersContainerId)
    .items.query<UserIdWithSearchQueries>(sqlQuery)
    .fetchAll();
  return resources;
};

export const getResultsHistoryForUser = async (
  email: string
): Promise<SearchResult[]> => {
  const sqlQuery: SqlQuerySpec = {
    query:
      "SELECT VALUE results FROM c JOIN results IN c.results WHERE c.userId = @userId",
    parameters: [
      {
        name: "@userId",
        value: email,
      },
    ],
  };
  const { resources } = await client
    .database(databaseId)
    .container(resultsContainerId)
    .items.query<SearchResult>(sqlQuery)
    .fetchAll();
  return resources;
};

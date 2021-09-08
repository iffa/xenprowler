import * as df from "durable-functions";
import { AzureFunction, Context } from "@azure/functions";

/**
 * Timer trigger: starts orchestration
 *
 * @param context Function context
 * @param _timer Timer trigger
 */
const httpStart: AzureFunction = async function (
  context: Context
): Promise<void> {
  const client = df.getClient(context);
  await client.startNew("ScoutOrchestrator");
};

export default httpStart;

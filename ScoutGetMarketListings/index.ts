import { AzureFunction } from "@azure/functions";
import { getMarketListings, MarketListing } from "../lib/scraper";

/**
 * Activity that returns latest market listings.
 * @returns Market listings
 */
const activityFunction: AzureFunction = async function (): Promise<
  MarketListing[]
> {
  return await getMarketListings();
};

export default activityFunction;

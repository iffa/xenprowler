import got from "got";
import * as cheerio from "cheerio";

const BBS_URL = process.env["BbsMarketListingsUrl"] || "";

export interface MarketListing {
  title: string;
  link: string;
}

export const getMarketPage = async (): Promise<string> => {
  const { body } = await got(BBS_URL, { encoding: "utf-8" });
  return body;
};

export const getMarketListings = async (): Promise<MarketListing[]> => {
  const page = await getMarketPage();
  const $ = cheerio.load(page);

  const structItems = $(".structItem-cell--main")
    .toArray()
    .flatMap((element) => {
      // last a tag is the actual title
      const titleElement = $(element).find(".structItem-title > a").last();
      const title = $(titleElement).text();
      const link = $(titleElement).attr("href");

      // skip if missing a link (unlikely, but this may be a false positive then)
      if (!link) {
        return [];
      }

      return {
        title,
        link,
      };
    });

  return structItems;
};

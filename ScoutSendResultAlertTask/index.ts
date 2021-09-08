import { AzureFunction, Context } from "@azure/functions";
import { MailDataRequired } from "@sendgrid/mail";
import { ResultSchema } from "../lib/cosmos";
import { sendEmail } from "../lib/email";
import {
  RESULTS_EMAIL_HTML_TEMPLATE,
  RESULT_HTML_TEMPLATE,
} from "./search-result-alert-template";

/**
 * Formats confidence to percentage value, where 0% is bad and 100% is good.
 * @param confidence Confidence number (0.0 - 1.0)
 * @returns Confidence as percentage
 */
const formatConfidence = (confidence: number) => {
  return (1.0 - confidence).toLocaleString(undefined, {
    style: "percent",
    minimumFractionDigits: 2,
  });
};

/**
 * Triggered when new results are saved. Sends email alert to the user.
 *
 * @param _context Function context
 * @param documents Documents that triggered this function
 */
const cosmosDBTrigger: AzureFunction = async function (
  _context: Context,
  documents?: ResultSchema[]
): Promise<void> {
  // unlikely but you never know
  if (!documents || documents.length === 0) {
    return;
  }

  if (!process.env["SendGridFromAddress"]) {
    return;
  }

  const messages: MailDataRequired[] = documents.map((document) => {
    const { results, userId } = document;
    const resultsHtml: string[] = results.map((x) =>
      RESULT_HTML_TEMPLATE.replace(
        /\[\[RESULT_LINK\]\]/g,
        `${process.env["BbsBaseUrl"] || ""}${x.item.link}`
      )
        .replace(/\[\[TITLE\]\]/g, x.item.title)
        .replace(/\[\[CONFIDENCE\]\]/g, formatConfidence(x.score || 0.0))
        .replace(/\[\[QUERY\]\]/g, x.query)
    );
    const emailHtml = RESULTS_EMAIL_HTML_TEMPLATE.replace(
      /\[\[RESULTS\]\]/g,
      resultsHtml.join("")
    );

    return {
      from: process.env["SendGridFromAddress"] || "",
      to: userId,
      subject: "Found matching results for your search!",
      html: emailHtml,
    };
  });

  await sendEmail(messages);
};

export default cosmosDBTrigger;

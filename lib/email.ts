import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env["SendGridApiKey"] || "");

export async function sendEmail(
  data: sgMail.MailDataRequired[]
): Promise<number> {
  return await sgMail.send(data).then(([response]) => response.statusCode);
}

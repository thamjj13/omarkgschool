import nodemailer from "nodemailer";
import { config } from "../config";
import { logger, logMail } from "../logger";

export interface SendResult {
  sent: boolean;
  mode: "smtp" | "log";
}

/**
 * Send an email. When SMTP is configured (SMTP_HOST + SMTP_USER) the message
 * is delivered through the real transport; otherwise it is written to
 * /logs/mail so transactional flows remain verifiable in development.
 */
export async function sendMail(
  to: string,
  subject: string,
  text: string
): Promise<SendResult> {
  if (!config.smtp.configured) {
    logMail(to, subject, text);
    return { sent: false, mode: "log" };
  }
  try {
    const transport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
    await transport.sendMail({
      from: config.smtp.from || config.smtp.user,
      to,
      subject,
      text,
    });
    logger.info(`[mail] sent to ${to}`);
    return { sent: true, mode: "smtp" };
  } catch (e) {
    logger.error("Failed to send email", e);
    logMail(to, subject, text);
    return { sent: false, mode: "log" };
  }
}

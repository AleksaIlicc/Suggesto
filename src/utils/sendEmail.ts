import ejs from 'ejs';
import moment from 'moment-timezone';
import path from 'path';
import transporter from '../config/nodemailer';

interface SendResult {
  success: boolean;
}

async function renderTemplate(templateName: string, data: Record<string, unknown>): Promise<string> {
  const templatePath = path.join(__dirname, '..', 'templates', templateName);
  return ejs.renderFile(templatePath, data) as Promise<string>;
}

async function sendForgotPassword(email: string, resetUrl: string, firstName?: string): Promise<SendResult> {
  try {
    const html = await renderTemplate('account-recovery.ejs', {
      RESET_URL: resetUrl,
      FIRST_NAME: firstName || '',
      APP_NAME: process.env.APP_NAME,
      YEAR: moment().toDate().getFullYear(),
    });

    const info = await transporter.sendMail({
      from: `${process.env.APP_NAME} <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Reset Your Password - ${process.env.APP_NAME}`,
      html,
    });

    return { success: Boolean(info) };
  } catch (error: unknown) {
    console.error('Error sending forgot-password email:', error);
    return { success: false };
  }
}

async function sendResetConfirmation(email: string, firstName?: string): Promise<SendResult> {
  try {
    const html = await renderTemplate('reset-success.ejs', {
      FIRST_NAME: firstName || '',
      APP_NAME: process.env.APP_NAME,
      YEAR: moment().toDate().getFullYear(),
    });

    const info = await transporter.sendMail({
      from: `${process.env.APP_NAME} <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Password Reset Successful - ${process.env.APP_NAME}`,
      html,
    });

    return { success: Boolean(info) };
  } catch (error: unknown) {
    console.error('Error sending reset-confirmation email:', error);
    return { success: false };
  }
}

export default {
  sendForgotPassword,
  sendResetConfirmation,
};

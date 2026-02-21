import { Resend } from 'resend';
import { Feedback } from '@/types';
import {
  generateNewFeedbackEmailHTML,
  generateNewFeedbackEmailText,
  NewFeedbackEmailData,
} from './new-feedback-template';
import {
  generateSummaryEmailHTML,
  generateSummaryEmailText,
} from './summary-template';
import { DailySummaryData } from '@/lib/summary';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<{
  success: boolean;
  error?: string;
  data?: { id: string };
}> {
  const { to, subject, html, text, from = 'TinyFeedback <onotificacoes@tinyfeedback.app>' } = options;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: { id: data?.id ?? '' } };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Exception sending email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send new feedback notification email
 */
export async function sendNewFeedbackEmail(
  to: string,
  data: NewFeedbackEmailData
): Promise<{
  success: boolean;
  error?: string;
  data?: { id: string };
}> {
  const { projectName, feedback } = data;
  const typeLabel = feedback.type === 'nps' 
    ? 'NPS' 
    : feedback.type === 'bug' 
    ? 'Bug' 
    : 'Sugestão';

  const subject = `📝 Novo ${typeLabel} - ${projectName}`;
  const html = generateNewFeedbackEmailHTML(data);
  const text = generateNewFeedbackEmailText(data);

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

/**
 * Send daily summary email
 */
export async function sendDailySummaryEmail(
  to: string,
  data: DailySummaryData
): Promise<{
  success: boolean;
  error?: string;
  data?: { id: string };
}> {
  const subject = `📊 Resumo Diário - ${data.projectName}`;
  const html = generateSummaryEmailHTML(data, 'daily');
  const text = generateSummaryEmailText(data, 'daily');

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

/**
 * Send weekly summary email
 */
export async function sendWeeklySummaryEmail(
  to: string,
  data: DailySummaryData
): Promise<{
  success: boolean;
  error?: string;
  data?: { id: string };
}> {
  const subject = `📊 Resumo Semanal - ${data.projectName}`;
  const html = generateSummaryEmailHTML(data, 'weekly');
  const text = generateSummaryEmailText(data, 'weekly');

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

/**
 * Check if Resend is properly configured
 */
export function isEmailServiceConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

// Email service exports
export { sendEmail, sendNewFeedbackEmail, sendDailySummaryEmail, sendWeeklySummaryEmail, isEmailServiceConfigured } from './service';
export type { SendEmailOptions } from './service';

// Email templates
export {
  generateNewFeedbackEmailHTML,
  generateNewFeedbackEmailText,
  type NewFeedbackEmailData,
} from './new-feedback-template';

export {
  generateSummaryEmailHTML,
  generateSummaryEmailText,
} from './summary-template';

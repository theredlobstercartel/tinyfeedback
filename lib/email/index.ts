// Email service exports
export { sendEmail, sendNewFeedbackEmail, sendDailySummaryEmail, sendWeeklySummaryEmail, sendResponseEmail, isEmailServiceConfigured } from './service';
export type { SendEmailOptions } from './service';

// Email templates
export {
  generateNewFeedbackEmailHTML,
  generateNewFeedbackEmailText,
  type NewFeedbackEmailData,
} from './new-feedback-template';

export {
  generateResponseEmailHTML,
  generateResponseEmailText,
  type ResponseEmailData,
} from './response-template';

export {
  generateSummaryEmailHTML,
  generateSummaryEmailText,
} from './summary-template';

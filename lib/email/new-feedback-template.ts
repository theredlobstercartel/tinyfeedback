import { Feedback } from '@/types';

export interface NewFeedbackEmailData {
  projectName: string;
  projectSlug: string;
  feedback: Feedback;
  dashboardUrl: string;
}

const feedbackTypeColors: Record<string, string> = {
  nps: '#00ff88',
  suggestion: '#4488ff',
  bug: '#ff4444',
};

const feedbackTypeLabels: Record<string, string> = {
  nps: 'NPS',
  suggestion: 'Sugestão',
  bug: 'Bug',
};

export function generateNewFeedbackEmailHTML(
  data: NewFeedbackEmailData
): string {
  const { projectName, projectSlug, feedback, dashboardUrl } = data;
  const feedbackType = feedback.type;
  const typeColor = feedbackTypeColors[feedbackType];
  const typeLabel = feedbackTypeLabels[feedbackType];
  
  // Truncate content for preview (first 150 chars)
  const contentPreview = feedback.content.length > 150
    ? feedback.content.substring(0, 150) + '...'
    : feedback.content;

  const feedbackUrl = `${dashboardUrl}/dashboard/projects/${projectSlug}/feedbacks/${feedback.id}`;
  
  const formattedDate = new Date(feedback.created_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Feedback - ${projectName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #000000;
      color: #ffffff;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0a0a0a;
      border: 1px solid #222222;
    }
    .header {
      background-color: #000000;
      padding: 32px 24px;
      text-align: center;
      border-bottom: 2px solid #00ff88;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #00ff88;
      letter-spacing: 2px;
    }
    .title {
      font-size: 20px;
      font-weight: bold;
      color: #ffffff;
      margin-top: 16px;
    }
    .subtitle {
      font-size: 14px;
      color: #888888;
      margin-top: 8px;
    }
    .content {
      padding: 24px;
    }
    .notification-badge {
      display: inline-block;
      background-color: #00ff88;
      color: #000000;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 24px;
      border-radius: 4px;
    }
    .feedback-card {
      background-color: #000000;
      border: 1px solid #333333;
      border-left: 4px solid ${typeColor};
      padding: 20px;
      margin-bottom: 24px;
    }
    .feedback-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .feedback-type {
      display: inline-block;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      background-color: ${typeColor}20;
      color: ${typeColor};
      border-radius: 4px;
    }
    .feedback-date {
      font-size: 12px;
      color: #888888;
    }
    .feedback-content {
      font-size: 15px;
      color: #ffffff;
      line-height: 1.6;
      margin-bottom: 16px;
      word-wrap: break-word;
    }
    .feedback-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 16px;
      border-top: 1px solid #222222;
    }
    .meta-item {
      font-size: 12px;
      color: #888888;
    }
    .meta-label {
      color: #555555;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    .meta-value {
      color: #cccccc;
    }
    .nps-score {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: ${typeColor};
      color: #000000;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 18px;
      font-weight: bold;
      margin-left: 8px;
    }
    .cta-button {
      display: block;
      background-color: #00ff88;
      color: #000000;
      text-decoration: none;
      text-align: center;
      padding: 16px 24px;
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 24px 0;
      border-radius: 4px;
    }
    .cta-button:hover {
      background-color: #00cc6a;
    }
    .secondary-link {
      display: block;
      text-align: center;
      color: #888888;
      font-size: 12px;
      text-decoration: none;
      margin-top: 8px;
    }
    .secondary-link:hover {
      color: #00ff88;
    }
    .footer {
      background-color: #000000;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #222222;
    }
    .footer-text {
      font-size: 12px;
      color: #888888;
    }
    .footer-link {
      color: #00ff88;
      text-decoration: none;
    }
    @media (max-width: 480px) {
      .feedback-header {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TINYFEEDBACK</div>
      <div class="title">Novo Feedback Recebido</div>
      <div class="subtitle">${projectName}</div>
    </div>
    
    <div class="content">
      <div class="notification-badge">🔔 Notificação Instantânea</div>
      
      <div class="feedback-card">
        <div class="feedback-header">
          <span class="feedback-type">${typeLabel}</span>
          <span class="feedback-date">${formattedDate}</span>
        </div>
        
        <div class="feedback-content">
          "${contentPreview}"
        </div>
        
        ${feedback.nps_score !== null ? `
        <div style="margin-top: 12px;">
          <span style="font-size: 12px; color: #888888;">Pontuação NPS:</span>
          <span class="nps-score">${feedback.nps_score}</span>
        </div>
        ` : ''}
        
        <div class="feedback-meta">
          ${feedback.user_email ? `
          <div class="meta-item">
            <span class="meta-label">Usuário</span>
            <span class="meta-value">${feedback.user_email}</span>
          </div>
          ` : ''}
          ${feedback.page_url ? `
          <div class="meta-item">
            <span class="meta-label">Página</span>
            <span class="meta-value">${feedback.page_url}</span>
          </div>
          ` : ''}
          <div class="meta-item">
            <span class="meta-label">ID do Feedback</span>
            <span class="meta-value">#${feedback.id.substring(0, 8)}</span>
          </div>
        </div>
      </div>
      
      <a href="${feedbackUrl}" class="cta-button">Ver Feedback no Dashboard</a>
      <a href="${dashboardUrl}/dashboard/projects/${projectSlug}/feedbacks" class="secondary-link">Ver todos os feedbacks do projeto</a>
    </div>

    <div class="footer">
      <p class="footer-text">
        Você está recebendo este email porque ativou notificações instantâneas.<br>
        <a href="${dashboardUrl}/dashboard/settings" class="footer-link">Gerenciar preferências</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateNewFeedbackEmailText(
  data: NewFeedbackEmailData
): string {
  const { projectName, projectSlug, feedback, dashboardUrl } = data;
  const typeLabel = feedbackTypeLabels[feedback.type];
  
  const feedbackUrl = `${dashboardUrl}/dashboard/projects/${projectSlug}/feedbacks/${feedback.id}`;
  
  const formattedDate = new Date(feedback.created_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
NOVO FEEDBACK - ${projectName}
=============================

Você recebeu um novo feedback em ${formattedDate}!

TIPO: ${typeLabel}
${feedback.nps_score !== null ? `PONTUAÇÃO NPS: ${feedback.nps_score}/10` : ''}

CONTEÚDO:
"${feedback.content}"

${feedback.user_email ? `USUÁRIO: ${feedback.user_email}` : ''}
${feedback.page_url ? `PÁGINA: ${feedback.page_url}` : ''}

VER FEEDBACK:
${feedbackUrl}

---
TinyFeedback - ${dashboardUrl}
  `.trim();
}

import { DailySummaryData } from '@/lib/summary';

export function generateSummaryEmailHTML(
  data: DailySummaryData,
  type: 'daily' | 'weekly'
): string {
  const title = type === 'daily' 
    ? `Resumo Diário - ${data.projectName}` 
    : `Resumo Semanal - ${data.projectName}`;
  
  const dateLabel = type === 'daily' ? 'Data' : 'Período';
  const npsScoreLabel = data.averageNps !== null 
    ? data.averageNps.toFixed(1) 
    : 'N/A';
  
  const npsPercentage = data.totalFeedbacks > 0 && data.averageNps !== null
    ? Math.round((data.averageNps / 10) * 100)
    : 0;

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

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background-color: #000000;
      border: 1px solid #222222;
      padding: 16px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #00ff88;
    }
    .stat-label {
      font-size: 12px;
      color: #888888;
      margin-top: 4px;
      text-transform: uppercase;
    }
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #00ff88;
      text-transform: uppercase;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #222222;
    }
    .nps-bar {
      background-color: #000000;
      border: 1px solid #222222;
      height: 32px;
      display: flex;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .nps-segment {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }
    .nps-promoters { background-color: #00ff88; color: #000000; }
    .nps-passives { background-color: #ffcc00; color: #000000; }
    .nps-detractors { background-color: #ff4444; color: #ffffff; }
    .nps-legend {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #888888;
    }
    .highlight-card {
      background-color: #000000;
      border: 1px solid #00ff88;
      padding: 16px;
      margin-bottom: 16px;
    }
    .highlight-type {
      display: inline-block;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .highlight-content {
      font-size: 14px;
      color: #ffffff;
      line-height: 1.5;
    }
    .highlight-score {
      font-size: 24px;
      font-weight: bold;
      color: #00ff88;
      margin-top: 8px;
    }
    .feedback-list {
      list-style: none;
    }
    .feedback-item {
      background-color: #000000;
      border: 1px solid #222222;
      padding: 12px;
      margin-bottom: 8px;
    }
    .feedback-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .feedback-type {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 2px 6px;
    }
    .feedback-date {
      font-size: 11px;
      color: #888888;
    }
    .feedback-content {
      font-size: 13px;
      color: #cccccc;
    }
    .feedback-score {
      font-size: 16px;
      font-weight: bold;
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
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TINYFEEDBACK</div>
      <div class="title">${title}</div>
      <div class="subtitle">${dateLabel}: ${data.date}</div>
    </div>
    
    <div class="content">
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${data.totalFeedbacks}</div>
          <div class="stat-label">Feedbacks</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${npsScoreLabel}</div>
          <div class="stat-label">Média NPS</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${npsPercentage}%</div>
          <div class="stat-label">Satisfação</div>
        </div>
      </div>

      <!-- NPS Distribution -->
      <div class="section">
        <div class="section-title">Distribuição NPS</div>
        <div class="nps-bar">
          ${data.npsDistribution.promoters > 0 ? `
            <div class="nps-segment nps-promoters" style="width: ${(data.npsDistribution.promoters / data.totalFeedbacks) * 100}%">
              ${data.npsDistribution.promoters}
            </div>
          ` : ''}
          ${data.npsDistribution.passives > 0 ? `
            <div class="nps-segment nps-passives" style="width: ${(data.npsDistribution.passives / data.totalFeedbacks) * 100}%">
              ${data.npsDistribution.passives}
            </div>
          ` : ''}
          ${data.npsDistribution.detractors > 0 ? `
            <div class="nps-segment nps-detractors" style="width: ${(data.npsDistribution.detractors / data.totalFeedbacks) * 100}%">
              ${data.npsDistribution.detractors}
            </div>
          ` : ''}
        </div>
        <div class="nps-legend">
          <span style="color: #00ff88;">● Promotores (${data.npsDistribution.promoters})</span>
          <span style="color: #ffcc00;">● Passivos (${data.npsDistribution.passives})</span>
          <span style="color: #ff4444;">● Detratores (${data.npsDistribution.detractors})</span>
        </div>
      </div>

      <!-- Top Feedback -->
      ${data.highlights.topFeedback ? `
        <div class="section">
          <div class="section-title">Destaque do ${type === 'daily' ? 'Dia' : 'Período'}</div>
          <div class="highlight-card">
            <span class="highlight-type" style="background-color: ${feedbackTypeColors[data.highlights.topFeedback.type]}; color: #000000;">
              ${feedbackTypeLabels[data.highlights.topFeedback.type]}
            </span>
            <div class="highlight-content">${data.highlights.topFeedback.content}</div>
            ${data.highlights.topFeedback.nps_score !== null ? `
              <div class="highlight-score">NPS: ${data.highlights.topFeedback.nps_score}/10</div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Recent Feedbacks -->
      <div class="section">
        <div class="section-title">Feedbacks Recentes</div>
        <ul class="feedback-list">
          ${data.highlights.recentFeedbacks.map(feedback => `
            <li class="feedback-item">
              <div class="feedback-header">
                <span class="feedback-type" style="background-color: ${feedbackTypeColors[feedback.type]}20; color: ${feedbackTypeColors[feedback.type]};">
                  ${feedbackTypeLabels[feedback.type]}
                </span>
                ${feedback.nps_score !== null ? `
                  <span class="feedback-score">${feedback.nps_score}/10</span>
                ` : ''}
              </div>
              <div class="feedback-content">${feedback.content}</div>
            </li>
          `).join('')}
        </ul>
        ${data.highlights.recentFeedbacks.length === 0 ? `
          <p style="color: #888888; text-align: center; padding: 24px;">
            Nenhum feedback recebido no ${type === 'daily' ? 'dia' : 'período'}.
          </p>
        ` : ''}
      </div>
    </div>

    <div class="footer">
      <p class="footer-text">
        Este resumo foi gerado automaticamente pelo TinyFeedback.<br>
        <a href="https://tinyfeedback.app/dashboard" class="footer-link">Acessar Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateSummaryEmailText(
  data: DailySummaryData,
  type: 'daily' | 'weekly'
): string {
  const title = type === 'daily' 
    ? `Resumo Diário - ${data.projectName}` 
    : `Resumo Semanal - ${data.projectName}`;
  
  const dateLabel = type === 'daily' ? 'Data' : 'Período';
  
  return `
${title}
${'='.repeat(title.length)}

${dateLabel}: ${data.date}

RESUMO
--------
Total de Feedbacks: ${data.totalFeedbacks}
Média NPS: ${data.averageNps !== null ? data.averageNps.toFixed(1) : 'N/A'}

DISTRIBUIÇÃO NPS
----------------
Promotores (9-10): ${data.npsDistribution.promoters}
Passivos (7-8): ${data.npsDistribution.passives}
Detratores (0-6): ${data.npsDistribution.detractors}

${data.highlights.topFeedback ? `FEEDBACK EM DESTAQUE
--------------------
Tipo: ${data.highlights.topFeedback.type.toUpperCase()}
${data.highlights.topFeedback.content}
${data.highlights.topFeedback.nps_score !== null ? `NPS: ${data.highlights.topFeedback.nps_score}/10` : ''}
` : ''}

FEEDBACKS RECENTES
------------------
${data.highlights.recentFeedbacks.map(f => `
[${f.type.toUpperCase()}] ${f.nps_score !== null ? `(NPS: ${f.nps_score}) ` : ''}${f.content.substring(0, 100)}${f.content.length > 100 ? '...' : ''}
`).join('\n') || 'Nenhum feedback recebido.'}

---
TinyFeedback - https://tinyfeedback.app/dashboard
  `.trim();
}

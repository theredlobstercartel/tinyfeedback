import { Feedback } from '@/types';

export interface ResponseEmailData {
  projectName: string;
  feedback: Feedback;
  responseContent: string;
}

export function generateResponseEmailHTML(data: ResponseEmailData): string {
  const { projectName, feedback, responseContent } = data;

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
  <title>Resposta ao seu Feedback - ${projectName}</title>
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
      border-bottom: 2px solid #00d4ff;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #00d4ff;
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
      background-color: #00d4ff;
      color: #000000;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    .response-card {
      background-color: #00d4ff10;
      border: 1px solid #00d4ff;
      border-left: 4px solid #00d4ff;
      padding: 20px;
      margin-bottom: 24px;
    }
    .response-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .response-icon {
      color: #00d4ff;
      font-size: 18px;
    }
    .response-title {
      font-size: 14px;
      font-weight: bold;
      color: #00d4ff;
      text-transform: uppercase;
    }
    .response-content {
      font-size: 15px;
      color: #ffffff;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .original-feedback {
      background-color: #000000;
      border: 1px solid #333333;
      padding: 20px;
      margin-bottom: 24px;
    }
    .original-header {
      font-size: 12px;
      color: #888888;
      text-transform: uppercase;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }
    .original-content {
      font-size: 14px;
      color: #aaaaaa;
      line-height: 1.6;
      font-style: italic;
      white-space: pre-wrap;
    }
    .original-date {
      font-size: 11px;
      color: #666666;
      margin-top: 12px;
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
      color: #00d4ff;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TINYFEEDBACK</div>
      <div class="title">Resposta ao seu Feedback</div>
      <div class="subtitle">${projectName}</div>
    </div>
    
    <div class="content">
      <div class="notification-badge">📧 Resposta Recebida</div>
      
      <div class="response-card">
        <div class="response-header">
          <span class="response-icon">✓</span>
          <span class="response-title">Resposta da Equipe</span>
        </div>
        
        <div class="response-content">
          ${responseContent.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div class="original-feedback">
        <div class="original-header">Seu Feedback Original</div>
        <div class="original-content">
          "${feedback.content}"
        </div>
        <div class="original-date">
          Enviado em ${formattedDate}
        </div>
      </div>
    </div>

    <div class="footer">
      <p class="footer-text">
        Obrigado por compartilhar sua opinião!<br>
        Sua contribuição ajuda a melhorar nosso produto.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateResponseEmailText(data: ResponseEmailData): string {
  const { projectName, feedback, responseContent } = data;

  const formattedDate = new Date(feedback.created_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
RESPOSTA AO SEU FEEDBACK - ${projectName}
====================================

Olá!

Recebemos sua mensagem e temos uma resposta para você:

---
RESPOSTA DA EQUIPE:

${responseContent}
---

SEU FEEDBACK ORIGINAL (enviado em ${formattedDate}):
"${feedback.content}"


Obrigado por compartilhar sua opinião!
Sua contribuição ajuda a melhorar nosso produto.

---
TinyFeedback
  `.trim();
}

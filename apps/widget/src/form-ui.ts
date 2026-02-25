/**
 * Feedback Form UI - HTML Templates and Styles
 * ST-13: Formulário de Sugestões e Bugs
 */

import { FormStep, FeedbackType } from './form'

// ============================================================================
// SVG Icons
// ============================================================================

const FORM_ICONS = {
  suggestion: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
      <path d="M9 21h6"/>
    </svg>
  `,
  bug: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m8 2 1.88 1.88"/>
      <path d="M14.12 3.88 16 2"/>
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/>
      <path d="M12 20v-9"/>
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5"/>
      <path d="M6 13H2"/>
      <path d="M3 21c0-2.1 1.7-3.9 3.8-4"/>
      <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/>
      <path d="M22 13h-4"/>
      <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
    </svg>
  `,
  other: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <path d="M12 17h.01"/>
    </svg>
  `,
  upload: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  `,
  image: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  `,
  check: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  `,
  arrowRight: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  `,
  arrowLeft: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  `,
  close: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `,
  ticket: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
      <path d="M13 5v2"/>
      <path d="M13 17v2"/>
      <path d="M13 11v2"/>
    </svg>
  `,
}

// ============================================================================
// Step Templates
// ============================================================================

export function renderTypeStep(selectedType?: FeedbackType): string {
  const types: { id: FeedbackType; label: string; icon: string; description: string }[] = [
    {
      id: 'suggestion',
      label: 'Sugestão',
      icon: FORM_ICONS.suggestion,
      description: 'Ideias para melhorar o produto',
    },
    {
      id: 'bug',
      label: 'Bug',
      icon: FORM_ICONS.bug,
      description: 'Reportar um problema',
    },
    {
      id: 'other',
      label: 'Outro',
      icon: FORM_ICONS.other,
      description: 'Outros tipos de feedback',
    },
  ]

  return `
    <div class="tf-form-step tf-step-type" role="tabpanel" aria-labelledby="tf-step-type-title">
      <h3 class="tf-step-title" id="tf-step-type-title">Que tipo de feedback você quer enviar?</h3>
      <div class="tf-type-grid" role="radiogroup" aria-label="Tipo de feedback">
        ${types
          .map(
            (type) => `
          <button
            type="button"
            class="tf-type-card ${selectedType === type.id ? 'tf-selected' : ''}"
            data-type="${type.id}"
            role="radio"
            aria-checked="${selectedType === type.id}"
            aria-describedby="tf-type-desc-${type.id}"
          >
            <span class="tf-type-icon" aria-hidden="true">${type.icon}</span>
            <span class="tf-type-label">${type.label}</span>
            <span class="tf-type-description" id="tf-type-desc-${type.id}">${type.description}</span>
          </button>
        `
          )
          .join('')}
      </div>
      <div class="tf-step-error" id="tf-type-error" role="alert" aria-live="polite"></div>
    </div>
  `
}

export function renderDetailsStep(
  data: { title?: string; description?: string; email?: string } = {},
  errors: Record<string, string> = {}
): string {
  return `
    <div class="tf-form-step tf-step-details" role="tabpanel" aria-labelledby="tf-step-details-title">
      <h3 class="tf-step-title" id="tf-step-details-title">Detalhes do feedback</h3>
      
      <div class="tf-form-group ${errors.title ? 'tf-has-error' : ''}">
        <label class="tf-label" for="tf-title">
          Título <span class="tf-required" aria-label="obrigatório">*</span>
        </label>
        <input
          type="text"
          class="tf-input"
          id="tf-title"
          name="title"
          value="${escapeHtml(data.title || '')}"
          placeholder="Um título curto para seu feedback"
          required
          minlength="5"
          maxlength="100"
          aria-required="true"
          aria-describedby="tf-title-help tf-title-error"
          aria-invalid="${errors.title ? 'true' : 'false'}"
        />
        <span class="tf-help-text" id="tf-title-help">Mínimo 5 caracteres</span>
        ${
          errors.title
            ? `<span class="tf-error-text" id="tf-title-error" role="alert">${escapeHtml(errors.title)}</span>`
            : ''
        }
        <div class="tf-char-count" aria-live="polite">${(data.title || '').length} / 100</div>
      </div>

      <div class="tf-form-group ${errors.description ? 'tf-has-error' : ''}">
        <label class="tf-label" for="tf-description">
          Descrição <span class="tf-required" aria-label="obrigatório">*</span>
        </label>
        <textarea
          class="tf-textarea"
          id="tf-description"
          name="description"
          placeholder="Descreva em detalhes..."
          required
          minlength="20"
          maxlength="2000"
          rows="5"
          aria-required="true"
          aria-describedby="tf-description-help tf-description-error"
          aria-invalid="${errors.description ? 'true' : 'false'}"
        >${escapeHtml(data.description || '')}</textarea>
        <span class="tf-help-text" id="tf-description-help">Mínimo 20 caracteres</span>
        ${
          errors.description
            ? `<span class="tf-error-text" id="tf-description-error" role="alert">${escapeHtml(errors.description)}</span>`
            : ''
        }
        <div class="tf-char-count" aria-live="polite">${(data.description || '').length} / 2000</div>
      </div>

      <div class="tf-form-group ${errors.email ? 'tf-has-error' : ''}">
        <label class="tf-label" for="tf-email">
          Email (opcional)
        </label>
        <input
          type="email"
          class="tf-input"
          id="tf-email"
          name="email"
          value="${escapeHtml(data.email || '')}"
          placeholder="seu@email.com"
          aria-describedby="tf-email-help tf-email-error"
          aria-invalid="${errors.email ? 'true' : 'false'}"
        />
        <span class="tf-help-text" id="tf-email-help">Para receber atualizações sobre seu feedback</span>
        ${
          errors.email
            ? `<span class="tf-error-text" id="tf-email-error" role="alert">${escapeHtml(errors.email)}</span>`
            : ''
        }
      </div>
    </div>
  `
}

export function renderUploadStep(
  file: File | null = null,
  previewUrl: string | null = null,
  error?: string
): string {
  const hasFile = file !== null

  return `
    <div class="tf-form-step tf-step-upload" role="tabpanel" aria-labelledby="tf-step-upload-title">
      <h3 class="tf-step-title" id="tf-step-upload-title">Adicionar screenshot (opcional)</h3>
      <p class="tf-step-subtitle">Ajude-nos a entender melhor com uma imagem</p>
      
      <div class="tf-upload-area ${hasFile ? 'tf-has-file' : ''} ${error ? 'tf-has-error' : ''}" 
           id="tf-upload-area"
           role="button"
           tabindex="0"
           aria-label="Área de upload de screenshot"
           aria-describedby="tf-upload-help tf-upload-error">
        <input
          type="file"
          class="tf-file-input"
          id="tf-screenshot"
          name="screenshot"
          accept="image/jpeg,image/png,image/jpg"
          aria-describedby="tf-upload-help"
        />
        
        ${
          hasFile && previewUrl
            ? `
          <div class="tf-upload-preview">
            <img src="${previewUrl}" alt="Preview do screenshot" class="tf-preview-image" />
            <button type="button" class="tf-remove-file" id="tf-remove-file" aria-label="Remover arquivo">
              ${FORM_ICONS.close}
            </button>
          </div>
        `
            : `
          <div class="tf-upload-placeholder">
            <span class="tf-upload-icon" aria-hidden="true">${FORM_ICONS.upload}</span>
            <span class="tf-upload-text">Clique ou arraste uma imagem aqui</span>
            <span class="tf-upload-hint" id="tf-upload-help">JPG ou PNG, máx. 2MB</span>
          </div>
        `
        }
      </div>
      
      ${error ? `<div class="tf-step-error" id="tf-upload-error" role="alert">${escapeHtml(error)}</div>` : ''}
      
      <div class="tf-skip-upload">
        <button type="button" class="tf-button tf-button-tertiary" id="tf-skip-upload">
          Pular esta etapa
        </button>
      </div>
    </div>
  `
}

export function renderConfirmationStep(ticketId: string): string {
  return `
    <div class="tf-form-step tf-step-confirmation" role="tabpanel" aria-labelledby="tf-step-confirmation-title">
      <div class="tf-confirmation-content">
        <div class="tf-confirmation-icon" aria-hidden="true">
          ${FORM_ICONS.check}
        </div>
        <h3 class="tf-step-title" id="tf-step-confirmation-title">Feedback enviado com sucesso!</h3>
        <p class="tf-confirmation-message">
          Obrigado por nos ajudar a melhorar. Seu feedback é muito importante.
        </p>
        
        <div class="tf-ticket-box">
          <span class="tf-ticket-icon" aria-hidden="true">${FORM_ICONS.ticket}</span>
          <div class="tf-ticket-info">
            <span class="tf-ticket-label">Número do ticket</span>
            <span class="tf-ticket-id" id="tf-ticket-id">${escapeHtml(ticketId)}</span>
          </div>
          <button type="button" class="tf-copy-button" id="tf-copy-ticket" aria-label="Copiar número do ticket">
            <span>Copiar</span>
          </button>
        </div>
        
        <p class="tf-ticket-hint">Guarde este número para acompanhar o status do seu feedback</p>
      </div>
    </div>
  `
}

export function renderStepIndicator(currentStep: FormStep, steps: FormStep[]): string {
  const stepLabels: Record<FormStep, string> = {
    type: 'Tipo',
    details: 'Detalhes',
    upload: 'Anexo',
    confirmation: 'Confirmação',
  }

  const currentIndex = steps.indexOf(currentStep)

  return `
    <div class="tf-step-indicator" aria-label="Progresso do formulário">
      ${steps
        .map((step, index) => {
          const isActive = index === currentIndex
          const isCompleted = index < currentIndex
          const stepNum = index + 1

          return `
          <div class="tf-step-item ${isActive ? 'tf-active' : ''} ${isCompleted ? 'tf-completed' : ''}" 
               aria-current="${isActive ? 'step' : 'false'}">
            <span class="tf-step-number" aria-hidden="true">
              ${isCompleted ? FORM_ICONS.check : stepNum}
            </span>
            <span class="tf-step-label">${stepLabels[step]}</span>
          </div>
        `
        })
        .join('')}
    </div>
  `
}

export function renderFormNavigation(
  currentStep: FormStep,
  canProceed: boolean,
  isSubmitting: boolean
): string {
  const isFirstStep = currentStep === 'type'
  const isLastStep = currentStep === 'upload'
  const isConfirmation = currentStep === 'confirmation'

  if (isConfirmation) {
    return `
      <div class="tf-form-navigation">
        <button type="button" class="tf-button tf-button-primary" id="tf-close-form">
          Fechar
        </button>
      </div>
    `
  }

  return `
    <div class="tf-form-navigation">
      <button 
        type="button" 
        class="tf-button tf-button-secondary ${isFirstStep ? 'tf-hidden' : ''}" 
        id="tf-prev-step"
        ${isSubmitting ? 'disabled' : ''}
      >
        <span class="tf-button-icon" aria-hidden="true">${FORM_ICONS.arrowLeft}</span>
        Voltar
      </button>
      
      <button 
        type="button" 
        class="tf-button tf-button-primary" 
        id="tf-next-step"
        ${!canProceed || isSubmitting ? 'disabled' : ''}
      >
        ${isSubmitting ? '<span class="tf-loading"></span>' : isLastStep ? 'Enviar' : 'Continuar'}
        ${!isSubmitting && !isLastStep ? `<span class="tf-button-icon" aria-hidden="true">${FORM_ICONS.arrowRight}</span>` : ''}
      </button>
    </div>
  `
}

// ============================================================================
// Helper Functions
// ============================================================================

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ============================================================================
// Form Styles
// ============================================================================

export function getFormStyles(): string {
  return `
    /* Form Modal Styles */
    .tf-form-modal {
      background: var(--tf-surface);
      border-radius: var(--tf-border-radius);
      border: 1px solid var(--tf-border);
      box-shadow: var(--tf-shadow-lg);
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: tf-form-entrance 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes tf-form-entrance {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .tf-form-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--tf-border);
    }

    .tf-form-title {
      font-size: var(--tf-font-size-lg);
      font-weight: 600;
      color: var(--tf-text);
      margin: 0;
    }

    .tf-form-close {
      width: 32px;
      height: 32px;
      border-radius: var(--tf-border-radius-sm);
      border: none;
      background: transparent;
      color: var(--tf-text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--tf-transition-fast);
    }

    .tf-form-close:hover {
      background: var(--tf-background);
      color: var(--tf-text);
    }

    /* Step Indicator */
    .tf-step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--tf-border);
      background: color-mix(in srgb, var(--tf-primary) 3%, transparent);
    }

    .tf-step-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: var(--tf-font-size-sm);
      font-weight: 500;
      color: var(--tf-text-muted);
      transition: all var(--tf-transition-fast);
    }

    .tf-step-item.tf-active {
      background: var(--tf-primary);
      color: var(--tf-background);
    }

    .tf-step-item.tf-completed {
      color: var(--tf-success);
    }

    .tf-step-number {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    .tf-step-number svg {
      width: 14px;
      height: 14px;
    }

    .tf-step-label {
      display: none;
    }

    @media (min-width: 400px) {
      .tf-step-label {
        display: inline;
      }
    }

    /* Form Content */
    .tf-form-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .tf-form-step {
      animation: tf-step-fade 0.25s ease-out;
    }

    @keyframes tf-step-fade {
      from {
        opacity: 0;
        transform: translateX(10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .tf-step-title {
      font-size: var(--tf-font-size-lg);
      font-weight: 600;
      color: var(--tf-text);
      margin: 0 0 8px 0;
    }

    .tf-step-subtitle {
      font-size: var(--tf-font-size);
      color: var(--tf-text-muted);
      margin: 0 0 20px 0;
    }

    /* Type Selection Grid */
    .tf-type-grid {
      display: grid;
      gap: 12px;
      margin-top: 16px;
    }

    .tf-type-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border: 2px solid var(--tf-border);
      border-radius: var(--tf-border-radius-sm);
      background: var(--tf-background);
      color: var(--tf-text);
      cursor: pointer;
      transition: all var(--tf-transition-fast);
      text-align: left;
    }

    .tf-type-card:hover {
      border-color: color-mix(in srgb, var(--tf-primary) 50%, var(--tf-border));
      background: color-mix(in srgb, var(--tf-primary) 5%, var(--tf-background));
    }

    .tf-type-card:focus-visible {
      outline: none;
      border-color: var(--tf-primary);
      box-shadow: var(--tf-focus-ring);
    }

    .tf-type-card.tf-selected {
      border-color: var(--tf-primary);
      background: color-mix(in srgb, var(--tf-primary) 10%, var(--tf-background));
    }

    .tf-type-card.tf-selected .tf-type-icon {
      color: var(--tf-primary);
    }

    .tf-type-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      color: var(--tf-text-muted);
      transition: color var(--tf-transition-fast);
    }

    .tf-type-label {
      font-size: var(--tf-font-size-lg);
      font-weight: 600;
      display: block;
    }

    .tf-type-description {
      font-size: var(--tf-font-size-sm);
      color: var(--tf-text-muted);
      display: block;
      margin-top: 2px;
    }

    /* Form Elements */
    .tf-form-group {
      margin-bottom: 20px;
    }

    .tf-form-group.tf-has-error .tf-input,
    .tf-form-group.tf-has-error .tf-textarea {
      border-color: var(--tf-error);
    }

    .tf-form-group.tf-has-error .tf-input:focus,
    .tf-form-group.tf-has-error .tf-textarea:focus {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--tf-error) 25%, transparent);
    }

    .tf-label {
      display: block;
      font-size: var(--tf-font-size-sm);
      font-weight: 600;
      color: var(--tf-text);
      margin-bottom: 6px;
    }

    .tf-required {
      color: var(--tf-error);
    }

    .tf-input,
    .tf-textarea {
      width: 100%;
      padding: 10px 12px;
      border: 2px solid var(--tf-border);
      border-radius: var(--tf-border-radius-sm);
      background: var(--tf-background);
      color: var(--tf-text);
      font-size: var(--tf-font-size);
      font-family: inherit;
      transition: all var(--tf-transition-fast);
      box-sizing: border-box;
    }

    .tf-input:focus,
    .tf-textarea:focus {
      outline: none;
      border-color: var(--tf-primary);
      box-shadow: var(--tf-focus-ring);
    }

    .tf-textarea {
      min-height: 120px;
      resize: vertical;
    }

    .tf-help-text {
      display: block;
      font-size: var(--tf-font-size-sm);
      color: var(--tf-text-muted);
      margin-top: 4px;
    }

    .tf-error-text {
      display: block;
      font-size: var(--tf-font-size-sm);
      color: var(--tf-error);
      margin-top: 4px;
    }

    .tf-char-count {
      font-size: var(--tf-font-size-sm);
      color: var(--tf-text-muted);
      text-align: right;
      margin-top: 4px;
    }

    /* Upload Area */
    .tf-upload-area {
      border: 2px dashed var(--tf-border);
      border-radius: var(--tf-border-radius-sm);
      padding: 32px 24px;
      text-align: center;
      cursor: pointer;
      transition: all var(--tf-transition-fast);
      position: relative;
    }

    .tf-upload-area:hover {
      border-color: var(--tf-primary);
      background: color-mix(in srgb, var(--tf-primary) 3%, transparent);
    }

    .tf-upload-area:focus-visible {
      outline: none;
      border-color: var(--tf-primary);
      box-shadow: var(--tf-focus-ring);
    }

    .tf-upload-area.tf-has-file {
      border-style: solid;
      border-color: var(--tf-success);
      background: color-mix(in srgb, var(--tf-success) 5%, transparent);
    }

    .tf-upload-area.tf-has-error {
      border-color: var(--tf-error);
    }

    .tf-file-input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      width: 100%;
      height: 100%;
    }

    .tf-upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    }

    .tf-upload-icon {
      width: 40px;
      height: 40px;
      color: var(--tf-text-muted);
    }

    .tf-upload-text {
      font-size: var(--tf-font-size);
      font-weight: 500;
      color: var(--tf-text);
    }

    .tf-upload-hint {
      font-size: var(--tf-font-size-sm);
      color: var(--tf-text-muted);
    }

    .tf-upload-preview {
      position: relative;
      display: inline-block;
    }

    .tf-preview-image {
      max-width: 100%;
      max-height: 200px;
      border-radius: var(--tf-border-radius-sm);
      box-shadow: var(--tf-shadow);
    }

    .tf-remove-file {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: var(--tf-error);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--tf-shadow);
      transition: transform var(--tf-transition-fast);
    }

    .tf-remove-file:hover {
      transform: scale(1.1);
    }

    .tf-remove-file svg {
      width: 16px;
      height: 16px;
    }

    .tf-skip-upload {
      text-align: center;
      margin-top: 16px;
    }

    .tf-button-tertiary {
      background: transparent;
      color: var(--tf-text-muted);
      border: none;
      padding: 8px 16px;
      font-size: var(--tf-font-size-sm);
    }

    .tf-button-tertiary:hover {
      color: var(--tf-text);
    }

    /* Confirmation Step */
    .tf-confirmation-content {
      text-align: center;
      padding: 20px 0;
    }

    .tf-confirmation-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 20px;
      color: var(--tf-success);
      animation: tf-check-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes tf-check-bounce {
      0% {
        opacity: 0;
        transform: scale(0) rotate(-45deg);
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        opacity: 1;
        transform: scale(1) rotate(0);
      }
    }

    .tf-confirmation-icon svg {
      width: 100%;
      height: 100%;
    }

    .tf-confirmation-message {
      color: var(--tf-text-muted);
      margin-bottom: 24px;
    }

    .tf-ticket-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--tf-background);
      border: 2px solid var(--tf-border);
      border-radius: var(--tf-border-radius-sm);
      margin-bottom: 12px;
    }

    .tf-ticket-icon {
      width: 32px;
      height: 32px;
      color: var(--tf-primary);
      flex-shrink: 0;
    }

    .tf-ticket-info {
      flex: 1;
      text-align: left;
    }

    .tf-ticket-label {
      display: block;
      font-size: var(--tf-font-size-sm);
      color: var(--tf-text-muted);
    }

    .tf-ticket-id {
      display: block;
      font-size: var(--tf-font-size-lg);
      font-weight: 700;
      font-family: monospace;
      color: var(--tf-text);
      letter-spacing: 0.5px;
    }

    .tf-copy-button {
      padding: 8px 16px;
      border: 1px solid var(--tf-border);
      border-radius: var(--tf-border-radius-sm);
      background: var(--tf-surface);
      color: var(--tf-text);
      font-size: var(--tf-font-size-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--tf-transition-fast);
    }

    .tf-copy-button:hover {
      border-color: var(--tf-primary);
      color: var(--tf-primary);
    }

    .tf-copy-button.tf-copied {
      background: var(--tf-success);
      border-color: var(--tf-success);
      color: white;
    }

    .tf-ticket-hint {
      font-size: var(--tf-font-size-sm);
      color: var(--tf-text-muted);
      margin: 0;
    }

    /* Step Error */
    .tf-step-error {
      padding: 12px 16px;
      background: color-mix(in srgb, var(--tf-error) 15%, transparent);
      border: 1px solid color-mix(in srgb, var(--tf-error) 40%, transparent);
      border-radius: var(--tf-border-radius-sm);
      color: var(--tf-error);
      font-size: var(--tf-font-size-sm);
      margin-top: 16px;
    }

    /* Navigation */
    .tf-form-navigation {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--tf-border);
      background: var(--tf-background);
    }

    .tf-form-navigation:has(.tf-hidden) {
      justify-content: flex-end;
    }

    .tf-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: var(--tf-border-radius-sm);
      font-size: var(--tf-font-size);
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all var(--tf-transition-fast);
      border: 2px solid transparent;
    }

    .tf-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .tf-button-primary {
      background: var(--tf-primary);
      color: var(--tf-background);
    }

    .tf-button-primary:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    .tf-button-secondary {
      background: transparent;
      color: var(--tf-text);
      border-color: var(--tf-border);
    }

    .tf-button-secondary:hover:not(:disabled) {
      border-color: var(--tf-primary);
      color: var(--tf-primary);
    }

    .tf-button-icon {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tf-button-icon svg {
      width: 100%;
      height: 100%;
    }

    .tf-hidden {
      display: none !important;
    }

    /* Loading Spinner */
    .tf-loading {
      width: 20px;
      height: 20px;
      border: 2px solid var(--tf-border);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: tf-spin 0.8s linear infinite;
    }

    @keyframes tf-spin {
      to { transform: rotate(360deg); }
    }

    /* Mobile Responsive */
    @media (max-width: 480px) {
      .tf-form-modal {
        max-width: calc(100vw - 32px);
        max-height: calc(100vh - 32px);
      }

      .tf-type-grid {
        grid-template-columns: 1fr;
      }

      .tf-step-indicator {
        padding: 12px;
      }

      .tf-step-item {
        padding: 4px 8px;
      }

      .tf-form-navigation {
        flex-direction: column-reverse;
      }

      .tf-button {
        width: 100%;
      }

      .tf-ticket-box {
        flex-direction: column;
        text-align: center;
      }

      .tf-ticket-info {
        text-align: center;
      }

      .tf-copy-button {
        width: 100%;
      }
    }
  `
}

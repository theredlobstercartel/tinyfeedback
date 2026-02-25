/**
 * FeedbackFormWidget - Multi-step Form Widget Implementation
 * ST-13: Formulário de Sugestões e Bugs
 * 
 * Extends the base widget with a form mode for detailed feedback submission
 */

import {
  FormStep,
  FeedbackType,
  FeedbackFormData,
  FeedbackApiConfig,
  SubmitFeedbackResult,
  FormState,
  initialFormState,
  validateStep,
  canProceed,
  submitFeedback,
  checkRateLimit,
  collectMetadata,
  generateTicketId,
} from './form'

import {
  renderTypeStep,
  renderDetailsStep,
  renderUploadStep,
  renderConfirmationStep,
  renderStepIndicator,
  renderFormNavigation,
  getFormStyles,
} from './form-ui'

export interface FeedbackFormWidgetConfig {
  apiKey: string
  apiUrl: string
  supabaseUrl?: string
  supabaseAnonKey?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme?: 'cyber-neon' | 'minimal' | 'dark'
  primaryColor?: string
  title?: string
  allowScreenshot?: boolean
  onSubmit?: (result: SubmitFeedbackResult) => void
  onClose?: () => void
}

const defaultFormConfig: FeedbackFormWidgetConfig = {
  apiKey: '',
  apiUrl: '',
  position: 'bottom-right',
  theme: 'cyber-neon',
  title: 'Enviar Feedback',
  allowScreenshot: true,
}

export class FeedbackFormWidget {
  private config: FeedbackFormWidgetConfig
  private container: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private formState: FormState = { ...initialFormState }
  private screenshotFile: File | null = null
  private screenshotPreview: string | null = null
  private isOpen = false
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(config: Partial<FeedbackFormWidgetConfig> = {}) {
    this.config = { ...defaultFormConfig, ...config }
    this.formState.data.metadata = collectMetadata()
  }

  init(): void {
    if (typeof document === 'undefined') return
    this.render()
  }

  private render(): void {
    this.destroy()

    // Create container
    this.container = document.createElement('div')
    this.container.id = 'tinyfeedback-form-widget'
    this.container.setAttribute('role', 'complementary')
    this.container.setAttribute('aria-label', 'Widget de formulário de feedback')

    // Create shadow DOM
    this.shadowRoot = this.container.attachShadow({ mode: 'open' })

    // Inject styles and render content
    this.shadowRoot.innerHTML = `
      <style>
        ${getFormStyles()}
        
        /* Widget Container */
        .tf-widget-container {
          position: fixed;
          ${this.getPositionStyles()}
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: var(--tf-text, #1a1a1a);
        }

        /* CSS Variables */
        :host {
          --tf-primary: ${this.getPrimaryColor()};
          --tf-background: ${this.getBackgroundColor()};
          --tf-surface: ${this.getSurfaceColor()};
          --tf-text: ${this.getTextColor()};
          --tf-text-muted: ${this.getTextMutedColor()};
          --tf-border: ${this.getBorderColor()};
          --tf-success: #00d084;
          --tf-error: #ff5252;
          --tf-warning: #ffb347;
          --tf-border-radius: 12px;
          --tf-border-radius-sm: 8px;
          --tf-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --tf-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --tf-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          --tf-focus-ring: 0 0 0 3px color-mix(in srgb, var(--tf-primary) 25%, transparent);
          --tf-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Trigger Button */
        .tf-trigger-button {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--tf-primary);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--tf-shadow-lg);
          transition: transform 0.2s, box-shadow 0.2s;
          color: white;
          animation: tf-trigger-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes tf-trigger-enter {
          from { opacity: 0; transform: scale(0) rotate(-180deg); }
          to { opacity: 1; transform: scale(1) rotate(0); }
        }

        .tf-trigger-button:hover {
          transform: scale(1.05);
          box-shadow: var(--tf-shadow-lg), 0 0 20px color-mix(in srgb, var(--tf-primary) 40%, transparent);
        }

        .tf-trigger-button svg {
          width: 28px;
          height: 28px;
        }

        /* Modal Overlay */
        .tf-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.25s, visibility 0.25s;
          z-index: 9999;
          padding: 20px;
        }

        .tf-modal-overlay.tf-open {
          opacity: 1;
          visibility: visible;
        }
      </style>
      
      <div class="tf-widget-container">
        ${this.renderTriggerButton()}
        ${this.renderModal()}
      </div>
    `

    document.body.appendChild(this.container)
    this.attachEventListeners()
  }

  private renderTriggerButton(): string {
    return `
      <button 
        class="tf-trigger-button" 
        id="tf-form-trigger"
        aria-label="Abrir formulário de feedback"
        aria-haspopup="dialog"
        aria-expanded="false"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    `
  }

  private renderModal(): string {
    return `
      <div class="tf-modal-overlay" id="tf-form-modal-overlay" aria-hidden="true">
        <div class="tf-form-modal" role="dialog" aria-modal="true" aria-labelledby="tf-form-title">
          <div class="tf-form-header">
            <h2 class="tf-form-title" id="tf-form-title">${this.escapeHtml(this.config.title || 'Enviar Feedback')}</h2>
            <button class="tf-form-close" id="tf-form-close" aria-label="Fechar formulário" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          
          ${renderStepIndicator(this.formState.step, this.getSteps())}
          
          <div class="tf-form-content" id="tf-form-content">
            ${this.renderCurrentStep()}
          </div>
          
          ${renderFormNavigation(
            this.formState.step,
            canProceed(this.formState.step, this.formState.data),
            this.formState.isSubmitting
          )}
        </div>
      </div>
    `
  }

  private renderCurrentStep(): string {
    switch (this.formState.step) {
      case 'type':
        return renderTypeStep(this.formState.data.type)
      case 'details':
        return renderDetailsStep(
          {
            title: this.formState.data.title,
            description: this.formState.data.description,
            email: this.formState.data.email,
          },
          this.formState.errors
        )
      case 'upload':
        return renderUploadStep(
          this.screenshotFile,
          this.screenshotPreview,
          this.formState.errors.screenshot
        )
      case 'confirmation':
        return renderConfirmationStep(this.formState.ticketId || '')
      default:
        return ''
    }
  }

  private getSteps(): FormStep[] {
    const steps: FormStep[] = ['type', 'details']
    if (this.config.allowScreenshot !== false) {
      steps.push('upload')
    }
    steps.push('confirmation')
    return steps
  }

  private getPositionStyles(): string {
    const positions: Record<string, string> = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;',
    }
    return positions[this.config.position || 'bottom-right']
  }

  private getPrimaryColor(): string {
    const colors: Record<string, string> = {
      'cyber-neon': '#00e5ff',
      'minimal': '#0052cc',
      'dark': '#66b3ff',
    }
    return this.config.primaryColor || colors[this.config.theme || 'cyber-neon']
  }

  private getBackgroundColor(): string {
    const colors: Record<string, string> = {
      'cyber-neon': '#0a0a0a',
      'minimal': '#ffffff',
      'dark': '#0f172a',
    }
    return colors[this.config.theme || 'cyber-neon']
  }

  private getSurfaceColor(): string {
    const colors: Record<string, string> = {
      'cyber-neon': '#141414',
      'minimal': '#f5f5f5',
      'dark': '#1e293b',
    }
    return colors[this.config.theme || 'cyber-neon']
  }

  private getTextColor(): string {
    const colors: Record<string, string> = {
      'cyber-neon': '#ffffff',
      'minimal': '#1a1a1a',
      'dark': '#f8fafc',
    }
    return colors[this.config.theme || 'cyber-neon']
  }

  private getTextMutedColor(): string {
    const colors: Record<string, string> = {
      'cyber-neon': '#b0b0b0',
      'minimal': '#595959',
      'dark': '#94a3b8',
    }
    return colors[this.config.theme || 'cyber-neon']
  }

  private getBorderColor(): string {
    const colors: Record<string, string> = {
      'cyber-neon': 'rgba(0, 229, 255, 0.2)',
      'minimal': '#d0d0d0',
      'dark': '#475569',
    }
    return colors[this.config.theme || 'cyber-neon']
  }

  private attachEventListeners(): void {
    if (!this.shadowRoot) return

    // Trigger button
    const trigger = this.shadowRoot.getElementById('tf-form-trigger')
    trigger?.addEventListener('click', () => this.open())

    // Close button
    const closeBtn = this.shadowRoot.getElementById('tf-form-close')
    closeBtn?.addEventListener('click', () => this.close())

    // Overlay click
    const overlay = this.shadowRoot.getElementById('tf-form-modal-overlay')
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close()
    })

    // Navigation buttons
    const nextBtn = this.shadowRoot.getElementById('tf-next-step')
    nextBtn?.addEventListener('click', () => this.handleNext())

    const prevBtn = this.shadowRoot.getElementById('tf-prev-step')
    prevBtn?.addEventListener('click', () => this.handlePrev())

    const closeFormBtn = this.shadowRoot.getElementById('tf-close-form')
    closeFormBtn?.addEventListener('click', () => this.close())

    // Step-specific event listeners
    this.attachStepEventListeners()

    // Keyboard handler
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close()
      }
    }
    document.addEventListener('keydown', this.keydownHandler)
  }

  private attachStepEventListeners(): void {
    if (!this.shadowRoot) return

    switch (this.formState.step) {
      case 'type':
        this.attachTypeStepListeners()
        break
      case 'details':
        this.attachDetailsStepListeners()
        break
      case 'upload':
        this.attachUploadStepListeners()
        break
      case 'confirmation':
        this.attachConfirmationStepListeners()
        break
    }
  }

  private attachTypeStepListeners(): void {
    if (!this.shadowRoot) return

    const typeCards = this.shadowRoot.querySelectorAll('.tf-type-card')
    typeCards.forEach((card) => {
      card.addEventListener('click', () => {
        const type = card.getAttribute('data-type') as FeedbackType
        this.selectType(type)
      })
    })
  }

  private attachDetailsStepListeners(): void {
    if (!this.shadowRoot) return

    const titleInput = this.shadowRoot.getElementById('tf-title') as HTMLInputElement
    const descInput = this.shadowRoot.getElementById('tf-description') as HTMLTextAreaElement
    const emailInput = this.shadowRoot.getElementById('tf-email') as HTMLInputElement

    titleInput?.addEventListener('input', () => {
      this.formState.data.title = titleInput.value
      this.updateCharCount(titleInput, 'tf-title')
      this.validateCurrentStep()
    })

    descInput?.addEventListener('input', () => {
      this.formState.data.description = descInput.value
      this.updateCharCount(descInput, 'tf-description')
      this.validateCurrentStep()
    })

    emailInput?.addEventListener('input', () => {
      this.formState.data.email = emailInput.value || undefined
      this.validateCurrentStep()
    })
  }

  private attachUploadStepListeners(): void {
    if (!this.shadowRoot) return

    const fileInput = this.shadowRoot.getElementById('tf-screenshot') as HTMLInputElement
    const uploadArea = this.shadowRoot.getElementById('tf-upload-area')
    const removeBtn = this.shadowRoot.getElementById('tf-remove-file')
    const skipBtn = this.shadowRoot.getElementById('tf-skip-upload')

    fileInput?.addEventListener('change', () => {
      if (fileInput.files?.[0]) {
        this.handleFileSelect(fileInput.files[0])
      }
    })

    // Drag and drop
    uploadArea?.addEventListener('dragover', (e) => {
      e.preventDefault()
      uploadArea.classList.add('tf-drag-over')
    })

    uploadArea?.addEventListener('dragleave', () => {
      uploadArea.classList.remove('tf-drag-over')
    })

    uploadArea?.addEventListener('drop', (e) => {
      e.preventDefault()
      uploadArea.classList.remove('tf-drag-over')
      const file = e.dataTransfer?.files[0]
      if (file) {
        this.handleFileSelect(file)
      }
    })

    removeBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.removeScreenshot()
    })

    skipBtn?.addEventListener('click', () => {
      this.goToStep('confirmation')
    })
  }

  private attachConfirmationStepListeners(): void {
    if (!this.shadowRoot) return

    const copyBtn = this.shadowRoot.getElementById('tf-copy-ticket')
    copyBtn?.addEventListener('click', () => {
      this.copyTicketId()
    })
  }

  private selectType(type: FeedbackType): void {
    this.formState.data.type = type

    // Update UI
    if (!this.shadowRoot) return
    const cards = this.shadowRoot.querySelectorAll('.tf-type-card')
    cards.forEach((card) => {
      const isSelected = card.getAttribute('data-type') === type
      card.classList.toggle('tf-selected', isSelected)
      card.setAttribute('aria-checked', String(isSelected))
    })

    // Clear error
    this.formState.errors = {}
    this.updateNavigation()
  }

  private handleFileSelect(file: File): void {
    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      this.formState.errors.screenshot = 'O arquivo deve ter no máximo 2MB'
      this.updateStep()
      return
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      this.formState.errors.screenshot = 'Apenas arquivos JPG e PNG são permitidos'
      this.updateStep()
      return
    }

    this.screenshotFile = file
    this.formState.data.screenshot = file
    this.formState.errors.screenshot = undefined

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      this.screenshotPreview = e.target?.result as string
      this.updateStep()
    }
    reader.readAsDataURL(file)
  }

  private removeScreenshot(): void {
    this.screenshotFile = null
    this.screenshotPreview = null
    this.formState.data.screenshot = undefined
    this.updateStep()
  }

  private updateCharCount(input: HTMLInputElement | HTMLTextAreaElement, prefix: string): void {
    if (!this.shadowRoot) return
    const counter = input.parentElement?.querySelector('.tf-char-count')
    if (counter) {
      counter.textContent = `${input.value.length} / ${input.maxLength}`
    }
  }

  private validateCurrentStep(): void {
    this.formState.errors = validateStep(this.formState.step, this.formState.data)
    this.updateNavigation()
  }

  private handleNext(): void {
    const errors = validateStep(this.formState.step, this.formState.data)
    this.formState.errors = errors

    if (Object.keys(errors).length > 0) {
      this.updateStep()
      return
    }

    const steps = this.getSteps()
    const currentIndex = steps.indexOf(this.formState.step)

    if (this.formState.step === 'upload' || 
        (this.formState.step === 'details' && this.config.allowScreenshot === false)) {
      this.submitForm()
    } else if (currentIndex < steps.length - 1) {
      this.goToStep(steps[currentIndex + 1])
    }
  }

  private handlePrev(): void {
    const steps = this.getSteps()
    const currentIndex = steps.indexOf(this.formState.step)

    if (currentIndex > 0) {
      this.goToStep(steps[currentIndex - 1])
    }
  }

  private goToStep(step: FormStep): void {
    this.formState.step = step
    this.formState.errors = {}
    this.updateStep()
    this.updateStepIndicator()
    this.updateNavigation()
  }

  private async submitForm(): Promise<void> {
    this.formState.isSubmitting = true
    this.updateNavigation()

    const apiConfig: FeedbackApiConfig = {
      apiKey: this.config.apiKey,
      apiUrl: this.config.apiUrl,
      supabaseUrl: this.config.supabaseUrl,
      supabaseAnonKey: this.config.supabaseAnonKey,
    }

    const result = await submitFeedback(this.formState.data as FeedbackFormData, apiConfig)

    this.formState.isSubmitting = false

    if (result.success) {
      this.formState.ticketId = result.ticketId
      this.goToStep('confirmation')
      this.config.onSubmit?.(result)
    } else {
      this.formState.errors.submit = result.error
      this.updateStep()
    }
  }

  private updateStep(): void {
    if (!this.shadowRoot) return
    const content = this.shadowRoot.getElementById('tf-form-content')
    if (content) {
      content.innerHTML = this.renderCurrentStep()
      this.attachStepEventListeners()
    }
  }

  private updateStepIndicator(): void {
    if (!this.shadowRoot) return
    const indicator = this.shadowRoot.querySelector('.tf-step-indicator')
    if (indicator) {
      indicator.outerHTML = renderStepIndicator(this.formState.step, this.getSteps())
    }
  }

  private updateNavigation(): void {
    if (!this.shadowRoot) return
    const nav = this.shadowRoot.querySelector('.tf-form-navigation')
    if (nav) {
      nav.outerHTML = renderFormNavigation(
        this.formState.step,
        canProceed(this.formState.step, this.formState.data),
        this.formState.isSubmitting
      )
    }
    this.attachNavigationListeners()
  }

  private attachNavigationListeners(): void {
    if (!this.shadowRoot) return

    const nextBtn = this.shadowRoot.getElementById('tf-next-step')
    nextBtn?.addEventListener('click', () => this.handleNext())

    const prevBtn = this.shadowRoot.getElementById('tf-prev-step')
    prevBtn?.addEventListener('click', () => this.handlePrev())

    const closeFormBtn = this.shadowRoot.getElementById('tf-close-form')
    closeFormBtn?.addEventListener('click', () => this.close())
  }

  private copyTicketId(): void {
    const ticketId = this.formState.ticketId
    if (!ticketId) return

    navigator.clipboard.writeText(ticketId).then(() => {
      if (!this.shadowRoot) return
      const copyBtn = this.shadowRoot.getElementById('tf-copy-ticket')
      if (copyBtn) {
        copyBtn.textContent = 'Copiado!'
        copyBtn.classList.add('tf-copied')
        setTimeout(() => {
          copyBtn.textContent = 'Copiar'
          copyBtn.classList.remove('tf-copied')
        }, 2000)
      }
    })
  }

  open(): void {
    if (!this.shadowRoot) return

    // Check rate limit before opening
    const rateLimit = checkRateLimit()
    if (!rateLimit.allowed) {
      const minutes = Math.ceil(rateLimit.resetInMs / 60000)
      alert(`Limite de envios atingido. Tente novamente em ${minutes} minutos.`)
      return
    }

    const overlay = this.shadowRoot.getElementById('tf-form-modal-overlay')
    const trigger = this.shadowRoot.getElementById('tf-form-trigger')

    overlay?.classList.add('tf-open')
    overlay?.setAttribute('aria-hidden', 'false')
    trigger?.setAttribute('aria-expanded', 'true')
    this.isOpen = true

    // Focus first element
    setTimeout(() => {
      const firstElement = this.shadowRoot?.querySelector('.tf-type-card, .tf-input') as HTMLElement
      firstElement?.focus()
    }, 100)
  }

  close(): void {
    if (!this.shadowRoot) return

    const overlay = this.shadowRoot.getElementById('tf-form-modal-overlay')
    const trigger = this.shadowRoot.getElementById('tf-form-trigger')

    overlay?.classList.remove('tf-open')
    overlay?.setAttribute('aria-hidden', 'true')
    trigger?.setAttribute('aria-expanded', 'false')
    this.isOpen = false

    this.config.onClose?.()
  }

  destroy(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }

    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    this.container = null
    this.shadowRoot = null
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }
}

// Factory function for easy initialization
export function initFeedbackForm(config: Partial<FeedbackFormWidgetConfig>): FeedbackFormWidget {
  const widget = new FeedbackFormWidget(config)
  widget.init()
  return widget
}

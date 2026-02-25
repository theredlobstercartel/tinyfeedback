/**
 * TinyFeedback Widget Core
 * ST-12: UX Polish - Animações e Acessibilidade
 * 
 * Accessibility Features:
 * - Focus trap within modal
 * - Skip link for keyboard users
 * - ARIA labels and roles on all interactive elements
 * - Keyboard navigation (Tab, Shift+Tab, Escape)
 * - Screen reader announcements
 * - Focus restoration on close
 */

import {
  WidgetConfig,
  WidgetTheme,
  WidgetPosition,
  defaultConfig,
  getMergedColors,
  WidgetColors,
} from './themes'
import { getWidgetBaseStyles, injectStyles } from './styles'

// SVG Icons with aria-hidden
const ICONS = {
  message: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  `,
  close: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `,
  nps: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 2v20M2 12h20"/>
    </svg>
  `,
  suggestion: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
      <path d="M9 21h6"/>
    </svg>
  `,
  bug: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
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
  success: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tf-success-icon" aria-hidden="true" focusable="false">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  `,
}

export interface TinyFeedbackWidget {
  init(config?: Partial<WidgetConfig>): void
  destroy(): void
  open(): void
  close(): void
  updateConfig(config: Partial<WidgetConfig>): void
}

class Widget implements TinyFeedbackWidget {
  private config: WidgetConfig = { ...defaultConfig }
  private container: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private isOpen = false
  private currentTab: 'nps' | 'suggestion' | 'bug' = 'nps'
  private apiKey: string = ''
  private previousFocus: Element | null = null
  private focusableElements: HTMLElement[] = []
  private announcer: HTMLElement | null = null
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null

  constructor() {
    // Check for data attributes
    if (typeof document !== 'undefined') {
      const script = document.currentScript as HTMLScriptElement | null
      if (script) {
        this.apiKey = script.dataset.tfApikey || ''
        const position = script.dataset.tfPosition as WidgetPosition
        const theme = script.dataset.tfTheme as WidgetTheme
        
        if (position) this.config.position = position
        if (theme) this.config.theme = theme
      }
    }
  }

  init(userConfig: Partial<WidgetConfig> = {}): void {
    if (typeof document === 'undefined') return

    // Merge configurations
    this.config = {
      ...defaultConfig,
      ...this.config,
      ...userConfig,
      labels: { ...defaultConfig.labels, ...userConfig.labels },
      colors: { ...this.config.colors, ...userConfig.colors },
    }

    this.render()
  }

  private render(): void {
    // Remove existing widget if any
    this.destroy()

    // Create container
    this.container = document.createElement('div')
    this.container.id = 'tinyfeedback-widget'
    this.container.setAttribute('role', 'complementary')
    this.container.setAttribute('aria-label', 'Widget de feedback')
    
    // Create shadow DOM
    this.shadowRoot = this.container.attachShadow({ mode: 'open' })

    // Get merged colors
    const colors = getMergedColors(this.config.theme, this.config.colors)

    // Inject styles
    const styles = getWidgetBaseStyles(colors, this.config.position)
    injectStyles(styles, this.shadowRoot)

    // Build widget HTML
    this.shadowRoot.innerHTML = `
      ${this.getStylesHTML(styles)}
      <div class="tf-widget-container tf-theme-${this.config.theme}">
        ${this.renderSkipLink()}
        ${this.renderTriggerButton()}
        ${this.renderModal()}
        ${this.renderAnnouncer()}
      </div>
    `

    // Append to body
    document.body.appendChild(this.container)

    // Attach event listeners
    this.attachEventListeners()
  }

  private getStylesHTML(styles: string): string {
    return `
      <style>
        ${styles}
      </style>
    `
  }

  private renderSkipLink(): string {
    return `
      <a href="#tf-modal" class="tf-skip-link" id="tf-skip-link">
        Pular para o formulário de feedback
      </a>
    `
  }

  private renderTriggerButton(): string {
    return `
      <button 
        class="tf-trigger-button" 
        id="tf-trigger" 
        aria-label="Abrir widget de feedback"
        aria-haspopup="dialog"
        aria-expanded="false"
        aria-controls="tf-modal"
        type="button"
      >
        <span class="tf-trigger-icon" aria-hidden="true">
          ${ICONS.message}
        </span>
        <span class="tf-sr-only">Abrir feedback</span>
      </button>
    `
  }

  private renderAnnouncer(): string {
    return `
      <div 
        id="tf-announcer" 
        class="tf-sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      ></div>
    `
  }

  private renderModal(): string {
    return `
      <div 
        class="tf-modal-overlay" 
        id="tf-modal-overlay"
        role="presentation"
        aria-hidden="true"
      >
        <div 
          class="tf-modal" 
          id="tf-modal"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="tf-modal-title"
          tabindex="-1"
        >
          <div class="tf-modal-header">
            <h2 class="tf-modal-title" id="tf-modal-title">Feedback</h2>
            <button 
              class="tf-modal-close" 
              id="tf-close" 
              aria-label="Fechar widget de feedback"
              type="button"
            >
              ${ICONS.close}
            </button>
          </div>
          <div class="tf-tabs" role="tablist" aria-label="Tipo de feedback">
            <button 
              class="tf-tab tf-active" 
              data-tab="nps" 
              role="tab" 
              aria-selected="true"
              aria-controls="tf-tabpanel-nps"
              id="tf-tab-nps"
              tabindex="0"
              type="button"
            >
              <span class="tf-tab-icon" aria-hidden="true">${ICONS.nps}</span>
              <span>NPS</span>
            </button>
            <button 
              class="tf-tab" 
              data-tab="suggestion" 
              role="tab" 
              aria-selected="false"
              aria-controls="tf-tabpanel-suggestion"
              id="tf-tab-suggestion"
              tabindex="-1"
              type="button"
            >
              <span class="tf-tab-icon" aria-hidden="true">${ICONS.suggestion}</span>
              <span>${this.config.labels.suggestion}</span>
            </button>
            <button 
              class="tf-tab" 
              data-tab="bug" 
              role="tab" 
              aria-selected="false"
              aria-controls="tf-tabpanel-bug"
              id="tf-tab-bug"
              tabindex="-1"
              type="button"
            >
              <span class="tf-tab-icon" aria-hidden="true">${ICONS.bug}</span>
              <span>${this.config.labels.bug}</span>
            </button>
          </div>
          <div class="tf-tab-contents">
            ${this.renderNPSTab()}
            ${this.renderSuggestionTab()}
            ${this.renderBugTab()}
          </div>
        </div>
      </div>
    `
  }

  private renderNPSTab(): string {
    return `
      <div 
        class="tf-tab-content tf-active" 
        id="tf-tabpanel-nps"
        data-tab-content="nps" 
        role="tabpanel"
        aria-labelledby="tf-tab-nps"
      >
        <form id="tf-form-nps" aria-label="Formulário NPS">
          <div class="tf-form-group">
            <label class="tf-label" id="tf-nps-label">${this.config.labels.nps}</label>
            <div class="tf-nps-scale" role="radiogroup" aria-labelledby="tf-nps-label">
              ${Array.from({ length: 11 }, (_, i) => `
                <button 
                  type="button" 
                  class="tf-nps-button" 
                  data-score="${i}" 
                  role="radio" 
                  aria-checked="false" 
                  aria-label="Nota ${i}"
                  tabindex="${i === 0 ? '0' : '-1'}"
                >
                  ${i}
                </button>
              `).join('')}
            </div>
            <div class="tf-nps-labels" aria-hidden="true">
              <span>Pouco provável</span>
              <span>Muito provável</span>
            </div>
          </div>
          <div class="tf-form-group">
            <label class="tf-label" for="tf-nps-comment">Comentário (opcional)</label>
            <textarea 
              class="tf-textarea" 
              id="tf-nps-comment" 
              name="comment"
              maxlength="500"
              placeholder="Conte-nos mais sobre sua experiência..."
              aria-describedby="tf-nps-comment-count"
            ></textarea>
            <div class="tf-char-count" id="tf-nps-comment-count" aria-live="polite">0 / 500</div>
          </div>
          <div class="tf-button-group">
            <button 
              type="button" 
              class="tf-button tf-button-secondary" 
              id="tf-cancel-nps"
            >${this.config.labels.cancel}</button>
            <button 
              type="submit" 
              class="tf-button tf-button-primary"
              aria-describedby="tf-nps-required"
            >${this.config.labels.submit}</button>
          </div>
          <span id="tf-nps-required" class="tf-sr-only">Selecione uma nota de 0 a 10 para enviar</span>
        </form>
      </div>
    `
  }

  private renderSuggestionTab(): string {
    return `
      <div 
        class="tf-tab-content" 
        id="tf-tabpanel-suggestion"
        data-tab-content="suggestion" 
        role="tabpanel"
        aria-labelledby="tf-tab-suggestion"
        hidden
      >
        <form id="tf-form-suggestion" aria-label="Formulário de sugestão">
          <div class="tf-form-group">
            <label class="tf-label" for="tf-suggestion-title">
              Título <span aria-label="obrigatório">*</span>
            </label>
            <input 
              type="text" 
              class="tf-input" 
              id="tf-suggestion-title" 
              name="title"
              minlength="5"
              maxlength="100"
              placeholder="Um título curto para sua sugestão"
              required
              aria-required="true"
              aria-describedby="tf-suggestion-title-count tf-suggestion-title-help"
            >
            <div class="tf-char-count" id="tf-suggestion-title-count" aria-live="polite">0 / 100</div>
            <span id="tf-suggestion-title-help" class="tf-sr-only">Mínimo 5 caracteres, máximo 100</span>
          </div>
          <div class="tf-form-group">
            <label class="tf-label" for="tf-suggestion-category">Categoria</label>
            <select 
              class="tf-select" 
              id="tf-suggestion-category" 
              name="category"
              aria-describedby="tf-suggestion-category-help"
            >
              ${this.config.categories.map((cat, i) => `
                <option value="${cat}">${cat}</option>
              `).join('')}
            </select>
            <span id="tf-suggestion-category-help" class="tf-sr-only">Selecione a categoria da sua sugestão</span>
          </div>
          <div class="tf-form-group">
            <label class="tf-label" for="tf-suggestion-description">
              Descrição <span aria-label="obrigatório">*</span>
            </label>
            <textarea 
              class="tf-textarea" 
              id="tf-suggestion-description" 
              name="description"
              minlength="20"
              maxlength="2000"
              placeholder="Descreva sua sugestão em detalhes..."
              required
              aria-required="true"
              aria-describedby="tf-suggestion-desc-count tf-suggestion-desc-help"
            ></textarea>
            <div class="tf-char-count" id="tf-suggestion-desc-count" aria-live="polite">0 / 2000</div>
            <span id="tf-suggestion-desc-help" class="tf-sr-only">Mínimo 20 caracteres, máximo 2000</span>
          </div>
          <div class="tf-button-group">
            <button 
              type="button" 
              class="tf-button tf-button-secondary" 
              id="tf-cancel-suggestion"
            >${this.config.labels.cancel}</button>
            <button type="submit" class="tf-button tf-button-primary">${this.config.labels.submit}</button>
          </div>
        </form>
      </div>
    `
  }

  private renderBugTab(): string {
    return `
      <div 
        class="tf-tab-content" 
        id="tf-tabpanel-bug"
        data-tab-content="bug" 
        role="tabpanel"
        aria-labelledby="tf-tab-bug"
        hidden
      >
        <form id="tf-form-bug" aria-label="Formulário de reporte de bug">
          <div class="tf-form-group">
            <label class="tf-label" for="tf-bug-description">
              Descrição do problema <span aria-label="obrigatório">*</span>
            </label>
            <textarea 
              class="tf-textarea" 
              id="tf-bug-description" 
              name="description"
              minlength="20"
              maxlength="2000"
              placeholder="Descreva o problema em detalhes: o que você estava fazendo, o que aconteceu, o que deveria acontecer..."
              required
              aria-required="true"
              aria-describedby="tf-bug-desc-count tf-bug-desc-help"
            ></textarea>
            <div class="tf-char-count" id="tf-bug-desc-count" aria-live="polite">0 / 2000</div>
            <span id="tf-bug-desc-help" class="tf-sr-only">Mínimo 20 caracteres, máximo 2000. Inclua passos para reproduzir o problema.</span>
          </div>
          <div class="tf-form-group">
            <label class="tf-checkbox-wrapper" for="tf-bug-technical">
              <input 
                type="checkbox" 
                class="tf-checkbox" 
                id="tf-bug-technical" 
                name="includeTechnicalInfo" 
                checked
                aria-describedby="tf-bug-technical-help"
              >
              <span class="tf-checkbox-label">Incluir informações técnicas (navegador, SO, etc.)</span>
            </label>
            <span id="tf-bug-technical-help" class="tf-sr-only">Desmarque se não quiser enviar dados técnicos do seu dispositivo</span>
          </div>
          <div class="tf-form-group">
            <label class="tf-label" for="tf-bug-email">Email para contato (opcional)</label>
            <input 
              type="email" 
              class="tf-input" 
              id="tf-bug-email" 
              name="contactEmail"
              placeholder="seu@email.com"
              aria-describedby="tf-bug-email-help"
            >
            <span id="tf-bug-email-help" class="tf-sr-only">Seu email será usado apenas para contato sobre este bug</span>
          </div>
          <div class="tf-button-group">
            <button 
              type="button" 
              class="tf-button tf-button-secondary" 
              id="tf-cancel-bug"
            >${this.config.labels.cancel}</button>
            <button type="submit" class="tf-button tf-button-primary">${this.config.labels.submit}</button>
          </div>
        </form>
      </div>
    `
  }

  private attachEventListeners(): void {
    if (!this.shadowRoot) return

    // Trigger button
    const trigger = this.shadowRoot.getElementById('tf-trigger')
    trigger?.addEventListener('click', () => this.open())

    // Skip link - focus to modal
    const skipLink = this.shadowRoot.getElementById('tf-skip-link')
    skipLink?.addEventListener('click', (e) => {
      e.preventDefault()
      this.open()
    })

    // Close button
    const closeBtn = this.shadowRoot.getElementById('tf-close')
    closeBtn?.addEventListener('click', () => this.close())

    // Overlay click
    const overlay = this.shadowRoot.getElementById('tf-modal-overlay')
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close()
    })

    // Tab switching
    const tabs = this.shadowRoot.querySelectorAll('.tf-tab')
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab') as 'nps' | 'suggestion' | 'bug'
        this.switchTab(tabName)
      })
    })

    // Cancel buttons
    const cancelBtns = this.shadowRoot.querySelectorAll('[id^="tf-cancel-"]')
    cancelBtns.forEach(btn => {
      btn.addEventListener('click', () => this.close())
    })

    // NPS buttons
    const npsButtons = this.shadowRoot.querySelectorAll('.tf-nps-button')
    npsButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        npsButtons.forEach(b => {
          b.classList.remove('tf-selected')
          b.setAttribute('aria-checked', 'false')
        })
        btn.classList.add('tf-selected')
        btn.setAttribute('aria-checked', 'true')
        this.announce(`Nota ${btn.getAttribute('data-score')} selecionada`)
      })

      // Keyboard navigation for radio buttons
      btn.addEventListener('keydown', (e) => {
        const buttons = Array.from(npsButtons) as HTMLElement[]
        const currentIndex = buttons.indexOf(e.target as HTMLElement)
        let newIndex = currentIndex

        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault()
            newIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1
            break
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault()
            newIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0
            break
          case 'Home':
            e.preventDefault()
            newIndex = 0
            break
          case 'End':
            e.preventDefault()
            newIndex = buttons.length - 1
            break
        }

        if (newIndex !== currentIndex) {
          buttons.forEach((b, i) => {
            b.setAttribute('tabindex', i === newIndex ? '0' : '-1')
          })
          buttons[newIndex].focus()
        }
      })
    })

    // Character counters
    this.setupCharCounters()

    // Form submissions
    this.setupFormSubmissions()

    // Keyboard shortcuts
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close()
      }

      // Tab key focus trap
      if (e.key === 'Tab' && this.isOpen) {
        this.handleTabKey(e)
      }
    }
    document.addEventListener('keydown', this.keydownHandler)

    // Tab keyboard navigation
    tabs.forEach(tab => {
      tab.addEventListener('keydown', (e) => {
        const tabElements = Array.from(tabs) as HTMLElement[]
        const currentIndex = tabElements.indexOf(e.target as HTMLElement)
        let newIndex = currentIndex

        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault()
            newIndex = currentIndex > 0 ? currentIndex - 1 : tabElements.length - 1
            break
          case 'ArrowRight':
            e.preventDefault()
            newIndex = currentIndex < tabElements.length - 1 ? currentIndex + 1 : 0
            break
          case 'Home':
            e.preventDefault()
            newIndex = 0
            break
          case 'End':
            e.preventDefault()
            newIndex = tabElements.length - 1
            break
        }

        if (newIndex !== currentIndex) {
          const newTab = tabElements[newIndex]
          const tabName = newTab.getAttribute('data-tab') as 'nps' | 'suggestion' | 'bug'
          this.switchTab(tabName)
          newTab.focus()
        }
      })
    })
  }

  private handleTabKey(e: KeyboardEvent): void {
    if (!this.shadowRoot) return

    const focusableElements = this.getFocusableElements()
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement = this.shadowRoot.activeElement

    if (e.shiftKey) {
      // Shift + Tab
      if (activeElement === firstElement || !focusableElements.includes(activeElement as HTMLElement)) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  private getFocusableElements(): HTMLElement[] {
    if (!this.shadowRoot) return []

    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const elements = Array.from(this.shadowRoot.querySelectorAll(selector)) as HTMLElement[]
    return elements.filter(el => !el.hasAttribute('disabled') && !el.hasAttribute('hidden'))
  }

  private setupCharCounters(): void {
    if (!this.shadowRoot) return

    const textareas = this.shadowRoot.querySelectorAll('.tf-textarea, .tf-input')
    textareas.forEach(el => {
      const input = el as HTMLTextAreaElement | HTMLInputElement
      const counter = input.parentElement?.querySelector('.tf-char-count')
      if (!counter) return

      const maxLength = parseInt(input.getAttribute('maxlength') || '0', 10)
      if (!maxLength) return

      input.addEventListener('input', () => {
        const current = input.value.length
        counter.textContent = `${current} / ${maxLength}`
        
        // Update visual states
        counter.classList.remove('tf-warning', 'tf-error')
        if (current >= maxLength) {
          counter.classList.add('tf-error')
        } else if (current >= maxLength * 0.9) {
          counter.classList.add('tf-warning')
        }
      })

      input.addEventListener('blur', () => {
        const current = input.value.length
        if (current >= maxLength) {
          this.announce(`Limite de ${maxLength} caracteres atingido`)
        }
      })
    })
  }

  private setupFormSubmissions(): void {
    if (!this.shadowRoot) return

    // NPS form
    const npsForm = this.shadowRoot.getElementById('tf-form-nps') as HTMLFormElement
    npsForm?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const selectedScore = this.shadowRoot?.querySelector('.tf-nps-button.tf-selected')
      if (!selectedScore) {
        this.announce('Por favor, selecione uma nota de 0 a 10')
        this.showError('Por favor, selecione uma nota de 0 a 10')
        return
      }
      // TODO: Submit NPS feedback
      this.showSuccess('Obrigado pelo seu feedback!')
    })

    // Suggestion form
    const suggestionForm = this.shadowRoot.getElementById('tf-form-suggestion') as HTMLFormElement
    suggestionForm?.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (!suggestionForm.checkValidity()) {
        suggestionForm.reportValidity()
        return
      }
      // TODO: Submit suggestion feedback
      this.showSuccess('Sugestão enviada com sucesso!')
    })

    // Bug form
    const bugForm = this.shadowRoot.getElementById('tf-form-bug') as HTMLFormElement
    bugForm?.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (!bugForm.checkValidity()) {
        bugForm.reportValidity()
        return
      }
      // TODO: Submit bug feedback
      this.showSuccess('Bug reportado com sucesso!')
    })
  }

  private switchTab(tab: 'nps' | 'suggestion' | 'bug'): void {
    if (!this.shadowRoot) return

    this.currentTab = tab

    // Update tab buttons
    const tabs = this.shadowRoot.querySelectorAll('.tf-tab')
    tabs.forEach(t => {
      const isActive = t.getAttribute('data-tab') === tab
      t.classList.toggle('tf-active', isActive)
      t.setAttribute('aria-selected', String(isActive))
      t.setAttribute('tabindex', isActive ? '0' : '-1')
    })

    // Update tab contents
    const contents = this.shadowRoot.querySelectorAll('.tf-tab-content')
    contents.forEach(c => {
      const isActive = c.getAttribute('data-tab-content') === tab
      c.classList.toggle('tf-active', isActive)
      if (isActive) {
        c.removeAttribute('hidden')
      } else {
        c.setAttribute('hidden', '')
      }
    })

    // Announce tab change to screen readers
    const tabNames: Record<string, string> = {
      'nps': 'NPS',
      'suggestion': 'Sugestão',
      'bug': 'Reportar problema'
    }
    this.announce(`${tabNames[tab]} tab selecionada`)

    // Focus first focusable element in new tab
    setTimeout(() => {
      const newContent = this.shadowRoot?.querySelector(`[data-tab-content="${tab}"]`)
      const firstFocusable = newContent?.querySelector('button, input, textarea, select') as HTMLElement
      firstFocusable?.focus()
    }, 50)
  }

  private announce(message: string): void {
    if (!this.shadowRoot) return
    
    const announcer = this.shadowRoot.getElementById('tf-announcer')
    if (announcer) {
      announcer.textContent = message
      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = ''
      }, 1000)
    }
  }

  private showSuccess(message: string): void {
    if (!this.shadowRoot) return

    this.announce(message)

    const activeContent = this.shadowRoot.querySelector('.tf-tab-content.tf-active')
    if (activeContent) {
      activeContent.innerHTML = `
        <div class="tf-success-message" role="alert" aria-live="polite">
          ${ICONS.success}
          <div style="font-weight: 600; margin-bottom: 8px; font-size: var(--tf-font-size-lg);">${message}</div>
          <div style="color: var(--tf-text-muted);">Sua opinião é muito importante para nós.</div>
        </div>
      `
    }

    // Auto-close after 3 seconds
    setTimeout(() => this.close(), 3000)
  }

  private showError(message: string): void {
    if (!this.shadowRoot) return

    this.announce(`Erro: ${message}`)

    // Remove any existing error
    const existingError = this.shadowRoot.querySelector('.tf-form-error')
    if (existingError) {
      existingError.remove()
    }

    const activeContent = this.shadowRoot.querySelector('.tf-tab-content.tf-active')
    const form = activeContent?.querySelector('form')
    if (form) {
      const errorDiv = document.createElement('div')
      errorDiv.className = 'tf-error-message tf-form-error'
      errorDiv.setAttribute('role', 'alert')
      errorDiv.setAttribute('aria-live', 'assertive')
      errorDiv.textContent = message
      form.insertBefore(errorDiv, form.firstChild)
    }
  }

  open(): void {
    if (!this.shadowRoot) return
    
    // Save current focus
    this.previousFocus = document.activeElement
    
    const overlay = this.shadowRoot.getElementById('tf-modal-overlay')
    const modal = this.shadowRoot.getElementById('tf-modal')
    const trigger = this.shadowRoot.getElementById('tf-trigger')
    
    overlay?.classList.add('tf-open')
    overlay?.setAttribute('aria-hidden', 'false')
    trigger?.setAttribute('aria-expanded', 'true')
    this.isOpen = true
    
    // Update focusable elements list
    this.focusableElements = this.getFocusableElements()
    
    // Focus the modal or first focusable element
    setTimeout(() => {
      const title = this.shadowRoot?.getElementById('tf-modal-title')
      title?.focus()
    }, 100)
  }

  close(): void {
    if (!this.shadowRoot) return
    
    const overlay = this.shadowRoot.getElementById('tf-modal-overlay')
    const trigger = this.shadowRoot.getElementById('tf-trigger')
    
    overlay?.classList.remove('tf-open')
    overlay?.setAttribute('aria-hidden', 'true')
    trigger?.setAttribute('aria-expanded', 'false')
    this.isOpen = false
    
    // Restore previous focus
    if (this.previousFocus && this.previousFocus instanceof HTMLElement) {
      setTimeout(() => {
        this.previousFocus?.focus()
      }, 0)
    }
  }

  updateConfig(newConfig: Partial<WidgetConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      labels: { ...this.config.labels, ...newConfig.labels },
      colors: { ...this.config.colors, ...newConfig.colors },
    }
    this.render()
  }

  destroy(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    this.container = null
    this.shadowRoot = null
  }
}

// Singleton instance
let widgetInstance: Widget | null = null

// Global API
export function init(config?: Partial<WidgetConfig>): TinyFeedbackWidget {
  if (!widgetInstance) {
    widgetInstance = new Widget()
  }
  widgetInstance.init(config)
  return widgetInstance
}

export function destroy(): void {
  widgetInstance?.destroy()
  widgetInstance = null
}

export function open(): void {
  widgetInstance?.open()
}

export function close(): void {
  widgetInstance?.close()
}

export function updateConfig(config: Partial<WidgetConfig>): void {
  widgetInstance?.updateConfig(config)
}

// Auto-init if data attributes are present
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init())
  } else {
    init()
  }
}

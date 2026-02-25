/*! TinyFeedback Widget v1.0.0 | MIT License */
var A={primary:"#00e5ff",secondary:"#ff4ecd",background:"#0a0a0a",surface:"#141414",text:"#ffffff",textMuted:"#b0b0b0",border:"#00e5ff33",success:"#00d084",error:"#ff5252",warning:"#ffb347"},W={primary:"#0052cc",secondary:"#403294",background:"#ffffff",surface:"#f5f5f5",text:"#1a1a1a",textMuted:"#595959",border:"#d0d0d0",success:"#006600",error:"#cc0000",warning:"#b35900"},z={primary:"#66b3ff",secondary:"#a5b4fc",background:"#0f172a",surface:"#1e293b",text:"#f8fafc",textMuted:"#94a3b8",border:"#475569",success:"#4ade80",error:"#f87171",warning:"#fbbf24"},x={"cyber-neon":A,minimal:W,dark:z},b={theme:"cyber-neon",position:"bottom-right",colors:{},labels:{nps:"Como voc\xEA avalia nosso produto?",suggestion:"Sugest\xE3o",bug:"Reportar um problema",submit:"Enviar",cancel:"Cancelar",close:"Fechar"},categories:["Feature","Improvement","Other"]};function y(o,t={}){return{...x[o],...t}}function w(o){return{"--tf-primary":o.primary,"--tf-secondary":o.secondary||o.primary,"--tf-background":o.background,"--tf-surface":o.surface,"--tf-text":o.text,"--tf-text-muted":o.textMuted,"--tf-border":o.border,"--tf-success":o.success,"--tf-error":o.error,"--tf-warning":o.warning}}function $(){return`
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      
      .tf-trigger-button {
        animation: none !important;
      }
      
      .tf-modal-overlay {
        transition: opacity 0.01ms ease !important;
      }
      
      .tf-modal {
        transition: transform 0.01ms ease !important;
      }
      
      .tf-nps-button,
      .tf-button,
      .tf-tab,
      .tf-input,
      .tf-textarea,
      .tf-select {
        transition: background-color 0.01ms ease, border-color 0.01ms ease !important;
      }
    }
  `}function E(o,t){let e=w(o),a=F(t);return`
    :host {
      ${Object.entries(e).map(([n,r])=>`${n}: ${r};`).join(`
      `)}
      --tf-z-index: 9999;
      --tf-border-radius: 12px;
      --tf-border-radius-sm: 8px;
      --tf-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --tf-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --tf-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      --tf-shadow-glow: 0 0 20px var(--tf-primary);
      --tf-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
      --tf-transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
      --tf-transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
      --tf-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      --tf-font-size-sm: 12px;
      --tf-font-size: 14px;
      --tf-font-size-lg: 16px;
      --tf-font-size-xl: 20px;
      --tf-focus-ring: 0 0 0 3px color-mix(in srgb, var(--tf-primary) 25%, transparent);
      --tf-focus-ring-offset: 0 0 0 2px var(--tf-surface), 0 0 0 4px var(--tf-primary);
    }

    /* Screen reader only text */
    .tf-sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .tf-widget-container {
      position: fixed;
      ${a}
      z-index: var(--tf-z-index);
      font-family: var(--tf-font-family);
      font-size: var(--tf-font-size);
      color: var(--tf-text);
      line-height: 1.5;
    }

    /* Trigger Button with Animation */
    .tf-trigger-button {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--tf-primary);
      border: 2px solid transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--tf-shadow-lg);
      transition: transform var(--tf-transition-base), 
                  box-shadow var(--tf-transition-base),
                  background-color var(--tf-transition-fast);
      position: relative;
      overflow: hidden;
      animation: tf-trigger-entrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes tf-trigger-entrance {
      0% {
        opacity: 0;
        transform: scale(0) rotate(-180deg);
      }
      70% {
        transform: scale(1.1) rotate(10deg);
      }
      100% {
        opacity: 1;
        transform: scale(1) rotate(0deg);
      }
    }

    .tf-trigger-button:hover {
      transform: scale(1.08);
      box-shadow: var(--tf-shadow-glow), var(--tf-shadow-lg);
    }

    .tf-trigger-button:active {
      transform: scale(0.92);
    }

    .tf-trigger-button:focus-visible {
      outline: none;
      box-shadow: var(--tf-focus-ring-offset), var(--tf-shadow-glow);
    }

    .tf-trigger-icon {
      width: 28px;
      height: 28px;
      color: var(--tf-background);
      transition: transform var(--tf-transition-base);
    }

    .tf-trigger-button:hover .tf-trigger-icon {
      transform: rotate(15deg) scale(1.1);
    }

    /* Pulse animation for attention (optional) */
    .tf-trigger-button.tf-pulse-attention {
      animation: tf-trigger-entrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                 tf-pulse-glow 2s ease-in-out infinite 1s;
    }

    @keyframes tf-pulse-glow {
      0%, 100% {
        box-shadow: var(--tf-shadow-lg), 0 0 0 0 color-mix(in srgb, var(--tf-primary) 40%, transparent);
      }
      50% {
        box-shadow: var(--tf-shadow-lg), 0 0 20px 10px color-mix(in srgb, var(--tf-primary) 0%, transparent);
      }
    }

    /* Cyber-neon glow effect */
    .tf-theme-cyber-neon .tf-trigger-button {
      box-shadow: 0 0 10px var(--tf-primary), var(--tf-shadow-lg);
      animation: tf-trigger-entrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                 tf-neon-pulse 3s ease-in-out infinite 0.5s;
    }

    @keyframes tf-neon-pulse {
      0%, 100% {
        box-shadow: 0 0 10px var(--tf-primary), var(--tf-shadow-lg);
      }
      50% {
        box-shadow: 0 0 25px var(--tf-primary), 0 0 50px color-mix(in srgb, var(--tf-primary) 50%, transparent), var(--tf-shadow-lg);
      }
    }

    .tf-theme-cyber-neon .tf-trigger-button:hover {
      box-shadow: 0 0 30px var(--tf-primary), 0 0 60px var(--tf-secondary), var(--tf-shadow-lg);
      animation: none;
    }

    .tf-theme-cyber-neon .tf-trigger-button:focus-visible {
      box-shadow: var(--tf-focus-ring-offset), 0 0 30px var(--tf-primary);
    }

    /* Modal Overlay with Fade Animation */
    .tf-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity var(--tf-transition-slow), 
                  visibility var(--tf-transition-slow);
      z-index: var(--tf-z-index);
    }

    .tf-modal-overlay.tf-open {
      opacity: 1;
      visibility: visible;
    }

    /* Modal with Scale + Slide Animation */
    .tf-modal {
      background: var(--tf-surface);
      border-radius: var(--tf-border-radius);
      border: 1px solid var(--tf-border);
      box-shadow: var(--tf-shadow-lg);
      width: 100%;
      max-width: 420px;
      max-height: 90vh;
      overflow: hidden;
      transform: scale(0.9) translateY(20px);
      opacity: 0;
      transition: transform var(--tf-transition-slow) cubic-bezier(0.34, 1.56, 0.64, 1),
                  opacity var(--tf-transition-base);
      will-change: transform, opacity;
    }

    .tf-modal-overlay.tf-open .tf-modal {
      transform: scale(1) translateY(0);
      opacity: 1;
    }

    /* Cyber-neon modal glow */
    .tf-theme-cyber-neon .tf-modal {
      box-shadow: 0 0 40px rgba(0, 240, 255, 0.15), var(--tf-shadow-lg);
      border-color: rgba(0, 240, 255, 0.3);
    }

    .tf-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--tf-border);
      animation: tf-slide-down 0.3s ease-out 0.1s both;
    }

    @keyframes tf-slide-down {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .tf-modal-title {
      font-size: var(--tf-font-size-lg);
      font-weight: 600;
      color: var(--tf-text);
      margin: 0;
    }

    .tf-modal-close {
      width: 36px;
      height: 36px;
      border-radius: var(--tf-border-radius-sm);
      border: 2px solid transparent;
      background: transparent;
      color: var(--tf-text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color var(--tf-transition-fast),
                  color var(--tf-transition-fast),
                  transform var(--tf-transition-fast),
                  border-color var(--tf-transition-fast);
    }

    .tf-modal-close:hover {
      background: var(--tf-background);
      color: var(--tf-text);
      transform: rotate(90deg);
    }

    .tf-modal-close:focus-visible {
      outline: none;
      border-color: var(--tf-primary);
      box-shadow: var(--tf-focus-ring);
    }

    /* Tabs with Animation */
    .tf-tabs {
      display: flex;
      border-bottom: 1px solid var(--tf-border);
      padding: 0 16px;
      gap: 8px;
      animation: tf-slide-down 0.3s ease-out 0.15s both;
    }

    .tf-tab {
      padding: 12px 16px;
      border: 2px solid transparent;
      border-bottom: none;
      background: transparent;
      color: var(--tf-text-muted);
      font-size: var(--tf-font-size);
      font-weight: 500;
      cursor: pointer;
      position: relative;
      transition: color var(--tf-transition-fast),
                  background-color var(--tf-transition-fast);
      display: flex;
      align-items: center;
      gap: 6px;
      border-radius: var(--tf-border-radius-sm) var(--tf-border-radius-sm) 0 0;
      margin-bottom: -1px;
    }

    .tf-tab:hover {
      color: var(--tf-text);
      background: color-mix(in srgb, var(--tf-primary) 5%, transparent);
    }

    .tf-tab:focus-visible {
      outline: none;
      border-color: var(--tf-primary);
      box-shadow: 0 -2px 0 0 var(--tf-primary);
    }

    .tf-tab.tf-active {
      color: var(--tf-primary);
      background: color-mix(in srgb, var(--tf-primary) 8%, transparent);
    }

    .tf-tab.tf-active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--tf-primary);
      border-radius: 2px 2px 0 0;
      animation: tf-tab-indicator 0.3s ease-out;
    }

    @keyframes tf-tab-indicator {
      from {
        transform: scaleX(0);
      }
      to {
        transform: scaleX(1);
      }
    }

    .tf-tab-icon {
      width: 18px;
      height: 18px;
    }

    /* Tab Content with Fade Animation */
    .tf-tab-content {
      display: none;
      padding: 20px;
      animation: tf-content-fade 0.25s ease-out;
    }

    @keyframes tf-content-fade {
      from {
        opacity: 0;
        transform: translateX(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .tf-tab-content.tf-active {
      display: block;
    }

    /* Form Elements */
    .tf-form-group {
      margin-bottom: 16px;
      animation: tf-slide-up 0.3s ease-out both;
    }

    .tf-form-group:nth-child(1) { animation-delay: 0.05s; }
    .tf-form-group:nth-child(2) { animation-delay: 0.1s; }
    .tf-form-group:nth-child(3) { animation-delay: 0.15s; }
    .tf-form-group:nth-child(4) { animation-delay: 0.2s; }

    @keyframes tf-slide-up {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .tf-label {
      display: block;
      font-size: var(--tf-font-size-sm);
      font-weight: 600;
      color: var(--tf-text);
      margin-bottom: 6px;
    }

    .tf-input,
    .tf-textarea,
    .tf-select {
      width: 100%;
      padding: 10px 12px;
      border: 2px solid var(--tf-border);
      border-radius: var(--tf-border-radius-sm);
      background: var(--tf-background);
      color: var(--tf-text);
      font-size: var(--tf-font-size);
      font-family: inherit;
      transition: border-color var(--tf-transition-fast),
                  box-shadow var(--tf-transition-fast),
                  background-color var(--tf-transition-fast);
      box-sizing: border-box;
    }

    .tf-input:hover,
    .tf-textarea:hover,
    .tf-select:hover {
      border-color: color-mix(in srgb, var(--tf-primary) 50%, var(--tf-border));
    }

    .tf-input:focus,
    .tf-textarea:focus,
    .tf-select:focus {
      outline: none;
      border-color: var(--tf-primary);
      box-shadow: var(--tf-focus-ring);
      background: var(--tf-surface);
    }

    /* Cyber-neon focus glow */
    .tf-theme-cyber-neon .tf-input:focus,
    .tf-theme-cyber-neon .tf-textarea:focus,
    .tf-theme-cyber-neon .tf-select:focus {
      box-shadow: 0 0 10px color-mix(in srgb, var(--tf-primary) 30%, transparent),
                  var(--tf-focus-ring);
    }

    .tf-textarea {
      min-height: 100px;
      resize: vertical;
    }

    .tf-char-count {
      font-size: var(--tf-font-size-sm);
      color: var(--tf-text-muted);
      text-align: right;
      margin-top: 4px;
      transition: color var(--tf-transition-fast);
    }

    .tf-char-count.tf-warning {
      color: var(--tf-warning);
    }

    .tf-char-count.tf-error {
      color: var(--tf-error);
      font-weight: 600;
    }

    /* NPS Scale with Animations */
    .tf-nps-scale {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      margin: 16px 0;
    }

    .tf-nps-button {
      flex: 1;
      aspect-ratio: 1;
      min-width: 32px;
      max-width: 44px;
      border: 2px solid var(--tf-border);
      border-radius: var(--tf-border-radius-sm);
      background: var(--tf-background);
      color: var(--tf-text);
      font-size: var(--tf-font-size);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--tf-transition-fast);
      animation: tf-nps-entrance 0.3s ease-out both;
      position: relative;
    }

    .tf-nps-button:nth-child(1) { animation-delay: 0.02s; }
    .tf-nps-button:nth-child(2) { animation-delay: 0.04s; }
    .tf-nps-button:nth-child(3) { animation-delay: 0.06s; }
    .tf-nps-button:nth-child(4) { animation-delay: 0.08s; }
    .tf-nps-button:nth-child(5) { animation-delay: 0.10s; }
    .tf-nps-button:nth-child(6) { animation-delay: 0.12s; }
    .tf-nps-button:nth-child(7) { animation-delay: 0.14s; }
    .tf-nps-button:nth-child(8) { animation-delay: 0.16s; }
    .tf-nps-button:nth-child(9) { animation-delay: 0.18s; }
    .tf-nps-button:nth-child(10) { animation-delay: 0.20s; }
    .tf-nps-button:nth-child(11) { animation-delay: 0.22s; }

    @keyframes tf-nps-entrance {
      from {
        opacity: 0;
        transform: translateY(10px) scale(0.8);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .tf-nps-button:hover {
      border-color: var(--tf-primary);
      background: color-mix(in srgb, var(--tf-primary) 10%, transparent);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .tf-nps-button:focus-visible {
      outline: none;
      border-color: var(--tf-primary);
      box-shadow: var(--tf-focus-ring);
      transform: translateY(-2px);
    }

    .tf-nps-button.tf-selected {
      background: var(--tf-primary);
      border-color: var(--tf-primary);
      color: var(--tf-background);
      transform: scale(1.05);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--tf-primary) 40%, transparent);
      animation: tf-nps-selected 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes tf-nps-selected {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); }
      100% { transform: scale(1.05); }
    }

    .tf-nps-button.tf-selected:focus-visible {
      box-shadow: var(--tf-focus-ring-offset);
    }

    .tf-nps-labels {
      display: flex;
      justify-content: space-between;
      font-size: var(--tf-font-size-sm);
      color: var(--tf-text-muted);
    }

    /* Buttons with Animations */
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
      position: relative;
      overflow: hidden;
    }

    .tf-button::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
      transform: translateX(-100%);
      transition: transform 0.6s ease;
    }

    .tf-button:hover::after {
      transform: translateX(100%);
    }

    .tf-button-primary {
      background: var(--tf-primary);
      color: var(--tf-background);
    }

    .tf-button-primary:hover {
      filter: brightness(1.1);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--tf-primary) 40%, transparent);
    }

    .tf-button-primary:focus-visible {
      outline: none;
      box-shadow: var(--tf-focus-ring-offset);
    }

    .tf-button-primary:active {
      transform: translateY(0);
    }

    .tf-button-secondary {
      background: transparent;
      color: var(--tf-text);
      border-color: var(--tf-border);
    }

    .tf-button-secondary:hover {
      background: var(--tf-background);
      border-color: var(--tf-primary);
      color: var(--tf-primary);
      transform: translateY(-2px);
    }

    .tf-button-secondary:focus-visible {
      outline: none;
      box-shadow: var(--tf-focus-ring);
    }

    .tf-button-secondary:active {
      transform: translateY(0);
    }

    .tf-button-group {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
      animation: tf-slide-up 0.3s ease-out 0.25s both;
    }

    /* Checkbox */
    .tf-checkbox-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 8px;
      border-radius: var(--tf-border-radius-sm);
      transition: background-color var(--tf-transition-fast);
    }

    .tf-checkbox-wrapper:hover {
      background: color-mix(in srgb, var(--tf-primary) 5%, transparent);
    }

    .tf-checkbox-wrapper:focus-within {
      box-shadow: var(--tf-focus-ring);
    }

    .tf-checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid var(--tf-border);
      border-radius: 4px;
      background: var(--tf-background);
      cursor: pointer;
      accent-color: var(--tf-primary);
      transition: border-color var(--tf-transition-fast);
    }

    .tf-checkbox:hover {
      border-color: var(--tf-primary);
    }

    .tf-checkbox:focus-visible {
      outline: none;
      box-shadow: var(--tf-focus-ring);
    }

    .tf-checkbox-label {
      font-size: var(--tf-font-size);
      color: var(--tf-text);
      user-select: none;
    }

    /* Loading State */
    .tf-loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid var(--tf-border);
      border-top-color: var(--tf-primary);
      border-radius: 50%;
      animation: tf-spin 0.8s linear infinite;
    }

    @keyframes tf-spin {
      to { transform: rotate(360deg); }
    }

    /* Success/Error Messages */
    .tf-success-message,
    .tf-error-message {
      padding: 24px;
      border-radius: var(--tf-border-radius-sm);
      text-align: center;
      margin: 20px 0;
      animation: tf-message-entrance 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes tf-message-entrance {
      0% {
        opacity: 0;
        transform: scale(0.8);
      }
      50% {
        transform: scale(1.05);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .tf-success-message {
      background: color-mix(in srgb, var(--tf-success) 15%, transparent);
      color: var(--tf-success);
      border: 2px solid color-mix(in srgb, var(--tf-success) 40%, transparent);
    }

    .tf-error-message {
      background: color-mix(in srgb, var(--tf-error) 15%, transparent);
      color: var(--tf-error);
      border: 2px solid color-mix(in srgb, var(--tf-error) 40%, transparent);
    }

    .tf-success-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      color: var(--tf-success);
      animation: tf-success-check 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
    }

    @keyframes tf-success-check {
      0% {
        opacity: 0;
        transform: scale(0) rotate(-45deg);
      }
      100% {
        opacity: 1;
        transform: scale(1) rotate(0deg);
      }
    }

    /* Skip link for accessibility */
    .tf-skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--tf-primary);
      color: var(--tf-background);
      padding: 8px 16px;
      z-index: calc(var(--tf-z-index) + 1);
      transition: top var(--tf-transition-fast);
      border-radius: 0 0 var(--tf-border-radius-sm) 0;
      font-weight: 600;
      text-decoration: none;
    }

    .tf-skip-link:focus {
      top: 0;
      outline: none;
      box-shadow: var(--tf-focus-ring);
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .tf-trigger-button,
      .tf-button-primary {
        border: 2px solid currentColor;
      }
      
      .tf-input,
      .tf-textarea,
      .tf-select {
        border-width: 2px;
      }
      
      .tf-tab.tf-active::after {
        height: 3px;
      }
    }

    /* Mobile responsive */
    @media (max-width: 480px) {
      .tf-widget-container {
        ${H(t)}
      }

      .tf-modal {
        max-width: calc(100vw - 32px);
        margin: 16px;
        max-height: calc(100vh - 32px);
      }

      .tf-nps-scale {
        gap: 4px;
      }

      .tf-nps-button {
        min-width: 28px;
        font-size: var(--tf-font-size-sm);
      }

      .tf-tabs {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }

      .tf-tabs::-webkit-scrollbar {
        display: none;
      }

      .tf-tab {
        padding: 10px 12px;
        font-size: var(--tf-font-size-sm);
        white-space: nowrap;
      }

      .tf-button-group {
        flex-direction: column-reverse;
        gap: 8px;
      }

      .tf-button {
        width: 100%;
      }
    }

    /* Focus visible polyfill support */
    .js-focus-visible :focus:not(.focus-visible) {
      outline: none;
    }

    ${$()}
  `}function F(o){return{"bottom-right":"bottom: 20px; right: 20px;","bottom-left":"bottom: 20px; left: 20px;","top-right":"top: 20px; right: 20px;","top-left":"top: 20px; left: 20px;"}[o]}function H(o){return{"bottom-right":"bottom: 16px; right: 16px;","bottom-left":"bottom: 16px; left: 16px;","top-right":"top: 16px; right: 16px;","top-left":"top: 16px; left: 16px;"}[o]}function S(o,t){let e=new CSSStyleSheet;e.replaceSync(o),t.adoptedStyleSheets=[e]}var p={message:`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  `,close:`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `,nps:`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 2v20M2 12h20"/>
    </svg>
  `,suggestion:`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
      <path d="M9 21h6"/>
    </svg>
  `,bug:`
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
  `,success:`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tf-success-icon" aria-hidden="true" focusable="false">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  `},k=class{constructor(){this.config={...b};this.container=null;this.shadowRoot=null;this.isOpen=!1;this.currentTab="nps";this.apiKey="";this.previousFocus=null;this.focusableElements=[];this.announcer=null;this.keydownHandler=null;if(typeof document<"u"){let t=document.currentScript;if(t){this.apiKey=t.dataset.tfApikey||"";let e=t.dataset.tfPosition,a=t.dataset.tfTheme;e&&(this.config.position=e),a&&(this.config.theme=a)}}}init(t={}){typeof document>"u"||(this.config={...b,...this.config,...t,labels:{...b.labels,...t.labels},colors:{...this.config.colors,...t.colors}},this.render())}render(){this.destroy(),this.container=document.createElement("div"),this.container.id="tinyfeedback-widget",this.container.setAttribute("role","complementary"),this.container.setAttribute("aria-label","Widget de feedback"),this.shadowRoot=this.container.attachShadow({mode:"open"});let t=y(this.config.theme,this.config.colors),e=E(t,this.config.position);S(e,this.shadowRoot),this.shadowRoot.innerHTML=`
      ${this.getStylesHTML(e)}
      <div class="tf-widget-container tf-theme-${this.config.theme}">
        ${this.renderSkipLink()}
        ${this.renderTriggerButton()}
        ${this.renderModal()}
        ${this.renderAnnouncer()}
      </div>
    `,document.body.appendChild(this.container),this.attachEventListeners()}getStylesHTML(t){return`
      <style>
        ${t}
      </style>
    `}renderSkipLink(){return`
      <a href="#tf-modal" class="tf-skip-link" id="tf-skip-link">
        Pular para o formul\xE1rio de feedback
      </a>
    `}renderTriggerButton(){return`
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
          ${p.message}
        </span>
        <span class="tf-sr-only">Abrir feedback</span>
      </button>
    `}renderAnnouncer(){return`
      <div 
        id="tf-announcer" 
        class="tf-sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      ></div>
    `}renderModal(){return`
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
              ${p.close}
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
              <span class="tf-tab-icon" aria-hidden="true">${p.nps}</span>
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
              <span class="tf-tab-icon" aria-hidden="true">${p.suggestion}</span>
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
              <span class="tf-tab-icon" aria-hidden="true">${p.bug}</span>
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
    `}renderNPSTab(){return`
      <div 
        class="tf-tab-content tf-active" 
        id="tf-tabpanel-nps"
        data-tab-content="nps" 
        role="tabpanel"
        aria-labelledby="tf-tab-nps"
      >
        <form id="tf-form-nps" aria-label="Formul\xE1rio NPS">
          <div class="tf-form-group">
            <label class="tf-label" id="tf-nps-label">${this.config.labels.nps}</label>
            <div class="tf-nps-scale" role="radiogroup" aria-labelledby="tf-nps-label">
              ${Array.from({length:11},(t,e)=>`
                <button 
                  type="button" 
                  class="tf-nps-button" 
                  data-score="${e}" 
                  role="radio" 
                  aria-checked="false" 
                  aria-label="Nota ${e}"
                  tabindex="${e===0?"0":"-1"}"
                >
                  ${e}
                </button>
              `).join("")}
            </div>
            <div class="tf-nps-labels" aria-hidden="true">
              <span>Pouco prov\xE1vel</span>
              <span>Muito prov\xE1vel</span>
            </div>
          </div>
          <div class="tf-form-group">
            <label class="tf-label" for="tf-nps-comment">Coment\xE1rio (opcional)</label>
            <textarea 
              class="tf-textarea" 
              id="tf-nps-comment" 
              name="comment"
              maxlength="500"
              placeholder="Conte-nos mais sobre sua experi\xEAncia..."
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
    `}renderSuggestionTab(){return`
      <div 
        class="tf-tab-content" 
        id="tf-tabpanel-suggestion"
        data-tab-content="suggestion" 
        role="tabpanel"
        aria-labelledby="tf-tab-suggestion"
        hidden
      >
        <form id="tf-form-suggestion" aria-label="Formul\xE1rio de sugest\xE3o">
          <div class="tf-form-group">
            <label class="tf-label" for="tf-suggestion-title">
              T\xEDtulo <span aria-label="obrigat\xF3rio">*</span>
            </label>
            <input 
              type="text" 
              class="tf-input" 
              id="tf-suggestion-title" 
              name="title"
              minlength="5"
              maxlength="100"
              placeholder="Um t\xEDtulo curto para sua sugest\xE3o"
              required
              aria-required="true"
              aria-describedby="tf-suggestion-title-count tf-suggestion-title-help"
            >
            <div class="tf-char-count" id="tf-suggestion-title-count" aria-live="polite">0 / 100</div>
            <span id="tf-suggestion-title-help" class="tf-sr-only">M\xEDnimo 5 caracteres, m\xE1ximo 100</span>
          </div>
          <div class="tf-form-group">
            <label class="tf-label" for="tf-suggestion-category">Categoria</label>
            <select 
              class="tf-select" 
              id="tf-suggestion-category" 
              name="category"
              aria-describedby="tf-suggestion-category-help"
            >
              ${this.config.categories.map((t,e)=>`
                <option value="${t}">${t}</option>
              `).join("")}
            </select>
            <span id="tf-suggestion-category-help" class="tf-sr-only">Selecione a categoria da sua sugest\xE3o</span>
          </div>
          <div class="tf-form-group">
            <label class="tf-label" for="tf-suggestion-description">
              Descri\xE7\xE3o <span aria-label="obrigat\xF3rio">*</span>
            </label>
            <textarea 
              class="tf-textarea" 
              id="tf-suggestion-description" 
              name="description"
              minlength="20"
              maxlength="2000"
              placeholder="Descreva sua sugest\xE3o em detalhes..."
              required
              aria-required="true"
              aria-describedby="tf-suggestion-desc-count tf-suggestion-desc-help"
            ></textarea>
            <div class="tf-char-count" id="tf-suggestion-desc-count" aria-live="polite">0 / 2000</div>
            <span id="tf-suggestion-desc-help" class="tf-sr-only">M\xEDnimo 20 caracteres, m\xE1ximo 2000</span>
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
    `}renderBugTab(){return`
      <div 
        class="tf-tab-content" 
        id="tf-tabpanel-bug"
        data-tab-content="bug" 
        role="tabpanel"
        aria-labelledby="tf-tab-bug"
        hidden
      >
        <form id="tf-form-bug" aria-label="Formul\xE1rio de reporte de bug">
          <div class="tf-form-group">
            <label class="tf-label" for="tf-bug-description">
              Descri\xE7\xE3o do problema <span aria-label="obrigat\xF3rio">*</span>
            </label>
            <textarea 
              class="tf-textarea" 
              id="tf-bug-description" 
              name="description"
              minlength="20"
              maxlength="2000"
              placeholder="Descreva o problema em detalhes: o que voc\xEA estava fazendo, o que aconteceu, o que deveria acontecer..."
              required
              aria-required="true"
              aria-describedby="tf-bug-desc-count tf-bug-desc-help"
            ></textarea>
            <div class="tf-char-count" id="tf-bug-desc-count" aria-live="polite">0 / 2000</div>
            <span id="tf-bug-desc-help" class="tf-sr-only">M\xEDnimo 20 caracteres, m\xE1ximo 2000. Inclua passos para reproduzir o problema.</span>
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
              <span class="tf-checkbox-label">Incluir informa\xE7\xF5es t\xE9cnicas (navegador, SO, etc.)</span>
            </label>
            <span id="tf-bug-technical-help" class="tf-sr-only">Desmarque se n\xE3o quiser enviar dados t\xE9cnicos do seu dispositivo</span>
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
            <span id="tf-bug-email-help" class="tf-sr-only">Seu email ser\xE1 usado apenas para contato sobre este bug</span>
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
    `}attachEventListeners(){if(!this.shadowRoot)return;this.shadowRoot.getElementById("tf-trigger")?.addEventListener("click",()=>this.open()),this.shadowRoot.getElementById("tf-skip-link")?.addEventListener("click",i=>{i.preventDefault(),this.open()}),this.shadowRoot.getElementById("tf-close")?.addEventListener("click",()=>this.close());let n=this.shadowRoot.getElementById("tf-modal-overlay");n?.addEventListener("click",i=>{i.target===n&&this.close()});let r=this.shadowRoot.querySelectorAll(".tf-tab");r.forEach(i=>{i.addEventListener("click",()=>{let s=i.getAttribute("data-tab");this.switchTab(s)})}),this.shadowRoot.querySelectorAll('[id^="tf-cancel-"]').forEach(i=>{i.addEventListener("click",()=>this.close())});let h=this.shadowRoot.querySelectorAll(".tf-nps-button");h.forEach(i=>{i.addEventListener("click",()=>{h.forEach(s=>{s.classList.remove("tf-selected"),s.setAttribute("aria-checked","false")}),i.classList.add("tf-selected"),i.setAttribute("aria-checked","true"),this.announce(`Nota ${i.getAttribute("data-score")} selecionada`)}),i.addEventListener("keydown",s=>{let f=Array.from(h),d=f.indexOf(s.target),l=d;switch(s.key){case"ArrowLeft":case"ArrowUp":s.preventDefault(),l=d>0?d-1:f.length-1;break;case"ArrowRight":case"ArrowDown":s.preventDefault(),l=d<f.length-1?d+1:0;break;case"Home":s.preventDefault(),l=0;break;case"End":s.preventDefault(),l=f.length-1;break}l!==d&&(f.forEach((g,v)=>{g.setAttribute("tabindex",v===l?"0":"-1")}),f[l].focus())})}),this.setupCharCounters(),this.setupFormSubmissions(),this.keydownHandler=i=>{i.key==="Escape"&&this.isOpen&&this.close(),i.key==="Tab"&&this.isOpen&&this.handleTabKey(i)},document.addEventListener("keydown",this.keydownHandler),r.forEach(i=>{i.addEventListener("keydown",s=>{let f=Array.from(r),d=f.indexOf(s.target),l=d;switch(s.key){case"ArrowLeft":s.preventDefault(),l=d>0?d-1:f.length-1;break;case"ArrowRight":s.preventDefault(),l=d<f.length-1?d+1:0;break;case"Home":s.preventDefault(),l=0;break;case"End":s.preventDefault(),l=f.length-1;break}if(l!==d){let g=f[l],v=g.getAttribute("data-tab");this.switchTab(v),g.focus()}})})}handleTabKey(t){if(!this.shadowRoot)return;let e=this.getFocusableElements();if(e.length===0)return;let a=e[0],n=e[e.length-1],r=this.shadowRoot.activeElement;t.shiftKey?(r===a||!e.includes(r))&&(t.preventDefault(),n.focus()):r===n&&(t.preventDefault(),a.focus())}getFocusableElements(){return this.shadowRoot?Array.from(this.shadowRoot.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(a=>!a.hasAttribute("disabled")&&!a.hasAttribute("hidden")):[]}setupCharCounters(){if(!this.shadowRoot)return;this.shadowRoot.querySelectorAll(".tf-textarea, .tf-input").forEach(e=>{let a=e,n=a.parentElement?.querySelector(".tf-char-count");if(!n)return;let r=parseInt(a.getAttribute("maxlength")||"0",10);r&&(a.addEventListener("input",()=>{let c=a.value.length;n.textContent=`${c} / ${r}`,n.classList.remove("tf-warning","tf-error"),c>=r?n.classList.add("tf-error"):c>=r*.9&&n.classList.add("tf-warning")}),a.addEventListener("blur",()=>{a.value.length>=r&&this.announce(`Limite de ${r} caracteres atingido`)}))})}setupFormSubmissions(){if(!this.shadowRoot)return;this.shadowRoot.getElementById("tf-form-nps")?.addEventListener("submit",async n=>{if(n.preventDefault(),!this.shadowRoot?.querySelector(".tf-nps-button.tf-selected")){this.announce("Por favor, selecione uma nota de 0 a 10"),this.showError("Por favor, selecione uma nota de 0 a 10");return}this.showSuccess("Obrigado pelo seu feedback!")});let e=this.shadowRoot.getElementById("tf-form-suggestion");e?.addEventListener("submit",async n=>{if(n.preventDefault(),!e.checkValidity()){e.reportValidity();return}this.showSuccess("Sugest\xE3o enviada com sucesso!")});let a=this.shadowRoot.getElementById("tf-form-bug");a?.addEventListener("submit",async n=>{if(n.preventDefault(),!a.checkValidity()){a.reportValidity();return}this.showSuccess("Bug reportado com sucesso!")})}switchTab(t){if(!this.shadowRoot)return;this.currentTab=t,this.shadowRoot.querySelectorAll(".tf-tab").forEach(r=>{let c=r.getAttribute("data-tab")===t;r.classList.toggle("tf-active",c),r.setAttribute("aria-selected",String(c)),r.setAttribute("tabindex",c?"0":"-1")}),this.shadowRoot.querySelectorAll(".tf-tab-content").forEach(r=>{let c=r.getAttribute("data-tab-content")===t;r.classList.toggle("tf-active",c),c?r.removeAttribute("hidden"):r.setAttribute("hidden","")});let n={nps:"NPS",suggestion:"Sugest\xE3o",bug:"Reportar problema"};this.announce(`${n[t]} tab selecionada`),setTimeout(()=>{this.shadowRoot?.querySelector(`[data-tab-content="${t}"]`)?.querySelector("button, input, textarea, select")?.focus()},50)}announce(t){if(!this.shadowRoot)return;let e=this.shadowRoot.getElementById("tf-announcer");e&&(e.textContent=t,setTimeout(()=>{e.textContent=""},1e3))}showSuccess(t){if(!this.shadowRoot)return;this.announce(t);let e=this.shadowRoot.querySelector(".tf-tab-content.tf-active");e&&(e.innerHTML=`
        <div class="tf-success-message" role="alert" aria-live="polite">
          ${p.success}
          <div style="font-weight: 600; margin-bottom: 8px; font-size: var(--tf-font-size-lg);">${t}</div>
          <div style="color: var(--tf-text-muted);">Sua opini\xE3o \xE9 muito importante para n\xF3s.</div>
        </div>
      `),setTimeout(()=>this.close(),3e3)}showError(t){if(!this.shadowRoot)return;this.announce(`Erro: ${t}`);let e=this.shadowRoot.querySelector(".tf-form-error");e&&e.remove();let n=this.shadowRoot.querySelector(".tf-tab-content.tf-active")?.querySelector("form");if(n){let r=document.createElement("div");r.className="tf-error-message tf-form-error",r.setAttribute("role","alert"),r.setAttribute("aria-live","assertive"),r.textContent=t,n.insertBefore(r,n.firstChild)}}open(){if(!this.shadowRoot)return;this.previousFocus=document.activeElement;let t=this.shadowRoot.getElementById("tf-modal-overlay"),e=this.shadowRoot.getElementById("tf-modal"),a=this.shadowRoot.getElementById("tf-trigger");t?.classList.add("tf-open"),t?.setAttribute("aria-hidden","false"),a?.setAttribute("aria-expanded","true"),this.isOpen=!0,this.focusableElements=this.getFocusableElements(),setTimeout(()=>{this.shadowRoot?.getElementById("tf-modal-title")?.focus()},100)}close(){if(!this.shadowRoot)return;let t=this.shadowRoot.getElementById("tf-modal-overlay"),e=this.shadowRoot.getElementById("tf-trigger");t?.classList.remove("tf-open"),t?.setAttribute("aria-hidden","true"),e?.setAttribute("aria-expanded","false"),this.isOpen=!1,this.previousFocus&&this.previousFocus instanceof HTMLElement&&setTimeout(()=>{this.previousFocus?.focus()},0)}updateConfig(t){this.config={...this.config,...t,labels:{...this.config.labels,...t.labels},colors:{...this.config.colors,...t.colors}},this.render()}destroy(){this.keydownHandler&&(document.removeEventListener("keydown",this.keydownHandler),this.keydownHandler=null),this.container&&this.container.parentNode&&this.container.parentNode.removeChild(this.container),this.container=null,this.shadowRoot=null}},u=null;function m(o){return u||(u=new k),u.init(o),u}function C(){u?.destroy(),u=null}function T(){u?.open()}function M(){u?.close()}function L(o){u?.updateConfig(o)}typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>m()):m());var R={version:"1.0.0",init:m,destroy:C,open:T,close:M,updateConfig:L,themes:x};typeof window<"u"&&(window.TinyFeedback=R);var et=R;export{et as default,b as defaultConfig,x as defaultThemes,w as generateCSSVariables,y as getMergedColors};
//# sourceMappingURL=widget.esm.js.map

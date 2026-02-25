/**
 * Widget Styles - CSS-in-JS with Accessibility & Animations
 * ST-12: UX Polish - Animações e Acessibilidade
 */

import { generateCSSVariables, WidgetColors, WidgetPosition } from './themes'

// Check if user prefers reduced motion
function getReducedMotionStyles(): string {
  return `
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
  `
}

// Base styles for the widget container
export function getWidgetBaseStyles(colors: WidgetColors, position: WidgetPosition): string {
  const cssVars = generateCSSVariables(colors)
  const positionStyles = getPositionStyles(position)

  return `
    :host {
      ${Object.entries(cssVars).map(([k, v]) => `${k}: ${v};`).join('\n      ')}
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
      ${positionStyles}
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
        ${getMobilePositionStyles(position)}
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

    ${getReducedMotionStyles()}
  `
}

function getPositionStyles(position: WidgetPosition): string {
  const styles: Record<WidgetPosition, string> = {
    'bottom-right': 'bottom: 20px; right: 20px;',
    'bottom-left': 'bottom: 20px; left: 20px;',
    'top-right': 'top: 20px; right: 20px;',
    'top-left': 'top: 20px; left: 20px;',
  }
  return styles[position]
}

function getMobilePositionStyles(position: WidgetPosition): string {
  const styles: Record<WidgetPosition, string> = {
    'bottom-right': 'bottom: 16px; right: 16px;',
    'bottom-left': 'bottom: 16px; left: 16px;',
    'top-right': 'top: 16px; right: 16px;',
    'top-left': 'top: 16px; left: 16px;',
  }
  return styles[position]
}

// Inject styles into the document
export function injectStyles(styles: string, shadowRoot: ShadowRoot): void {
  const styleSheet = new CSSStyleSheet()
  styleSheet.replaceSync(styles)
  shadowRoot.adoptedStyleSheets = [styleSheet]
}

// Create a style element for fallback browsers
export function createStyleElement(styles: string): HTMLStyleElement {
  const style = document.createElement('style')
  style.textContent = styles
  return style
}

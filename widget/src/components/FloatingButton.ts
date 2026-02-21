/**
 * Floating Button Component
 * Story: ST-05 - Criar Widget Vanilla JS
 * AC-02: Botão flutuante
 */

export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface FloatingButtonOptions {
  position?: WidgetPosition;
  color?: string;
  text?: string;
  onClick?: () => void;
}

export class FloatingButton {
  private button: HTMLButtonElement | null = null;
  private options: Required<FloatingButtonOptions>;
  private menuContainer: HTMLElement | null = null;
  private isMenuOpen = false;
  private onSelectCallback?: (type: 'nps' | 'suggestion' | 'bug') => void;

  constructor(options: FloatingButtonOptions = {}) {
    this.options = {
      position: options.position || 'bottom-right',
      color: options.color || '#00ff88',
      text: options.text || 'Feedback',
      onClick: options.onClick || (() => {})
    };
  }

  /**
   * Mount the floating button to the DOM
   */
  public mount(): void {
    if (this.button) return; // Already mounted

    this.button = document.createElement('button');
    this.button.id = 'tf-floating-btn';
    this.button.innerHTML = this.getButtonIcon();
    this.button.style.cssText = this.getButtonStyles();
    this.button.setAttribute('aria-label', 'Abrir feedback');

    // Add click handler
    this.button.addEventListener('click', () => this.toggleMenu());

    document.body.appendChild(this.button);
  }

  /**
   * Unmount the button from the DOM
   */
  public unmount(): void {
    this.closeMenu();
    if (this.button) {
      this.button.remove();
      this.button = null;
    }
  }

  /**
   * Update button options
   */
  public update(options: Partial<FloatingButtonOptions>): void {
    this.options = { ...this.options, ...options };
    if (this.button) {
      this.button.style.cssText = this.getButtonStyles();
    }
  }

  /**
   * Set callback for menu selection
   */
  public onSelect(callback: (type: 'nps' | 'suggestion' | 'bug') => void): void {
    this.onSelectCallback = callback;
  }

  /**
   * Toggle the feedback menu
   */
  private toggleMenu(): void {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /**
   * Open the feedback type menu
   */
  private openMenu(): void {
    if (!this.button || this.isMenuOpen) return;

    this.isMenuOpen = true;
    
    // Create menu container
    this.menuContainer = document.createElement('div');
    this.menuContainer.id = 'tf-menu-container';
    this.menuContainer.style.cssText = this.getMenuContainerStyles();

    // Menu items
    const menuItems: { type: 'nps' | 'suggestion' | 'bug'; icon: string; label: string; color: string }[] = [
      { type: 'nps', icon: '📊', label: 'Avaliação', color: '#00ff88' },
      { type: 'suggestion', icon: '💡', label: 'Sugestão', color: '#ffaa00' },
      { type: 'bug', icon: '🐛', label: 'Reportar Bug', color: '#ff4444' }
    ];

    menuItems.forEach((item, index) => {
      const menuItem = document.createElement('button');
      menuItem.className = 'tf-menu-item';
      menuItem.style.cssText = this.getMenuItemStyles(item.color, index);
      menuItem.innerHTML = `
        <span style="font-size: 20px;">${item.icon}</span>
        <span style="font-size: 14px; font-weight: 500;">${item.label}</span>
      `;
      menuItem.addEventListener('click', () => {
        this.closeMenu();
        this.onSelectCallback?.(item.type);
      });
      this.menuContainer?.appendChild(menuItem);
    });

    document.body.appendChild(this.menuContainer);

    // Animate items in
    requestAnimationFrame(() => {
      const items = this.menuContainer?.querySelectorAll('.tf-menu-item');
      items?.forEach((item, i) => {
        setTimeout(() => {
          (item as HTMLElement).style.opacity = '1';
          (item as HTMLElement).style.transform = 'translateY(0)';
        }, i * 50);
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', this.handleOutsideClick);
  }

  /**
   * Close the menu
   */
  private closeMenu(): void {
    if (!this.menuContainer) return;
    
    this.isMenuOpen = false;
    this.menuContainer.remove();
    this.menuContainer = null;
    document.removeEventListener('click', this.handleOutsideClick);
  }

  /**
   * Handle clicks outside the menu
   */
  private handleOutsideClick = (e: MouseEvent): void => {
    if (
      this.menuContainer && 
      !this.menuContainer.contains(e.target as Node) &&
      !this.button?.contains(e.target as Node)
    ) {
      this.closeMenu();
    }
  };

  /**
   * Get button SVG icon
   */
  private getButtonIcon(): string {
    return `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" 
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  /**
   * Get button position styles
   */
  private getPositionStyles(): string {
    const positions: Record<WidgetPosition, string> = {
      'bottom-right': 'bottom: 24px; right: 24px;',
      'bottom-left': 'bottom: 24px; left: 24px;',
      'top-right': 'top: 24px; right: 24px;',
      'top-left': 'top: 24px; left: 24px;'
    };
    return positions[this.options.position];
  }

  /**
   * Get button styles
   */
  private getButtonStyles(): string {
    const positionStyles = this.getPositionStyles();
    return `
      position: fixed;
      ${positionStyles}
      width: 56px;
      height: 56px;
      border-radius: 0;
      background: ${this.options.color};
      color: #000;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px ${this.options.color}40;
      z-index: 999998;
      transition: all 0.3s ease;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
  }

  /**
   * Get menu container styles
   */
  private getMenuContainerStyles(): string {
    const positionStyles = this.getMenuPositionStyles();
    return `
      position: fixed;
      ${positionStyles}
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 999997;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
  }

  /**
   * Get menu position based on button position
   */
  private getMenuPositionStyles(): string {
    const positions: Record<WidgetPosition, string> = {
      'bottom-right': 'bottom: 88px; right: 24px;',
      'bottom-left': 'bottom: 88px; left: 24px;',
      'top-right': 'top: 88px; right: 24px;',
      'top-left': 'top: 88px; left: 24px;'
    };
    return positions[this.options.position];
  }

  /**
   * Get menu item styles
   */
  private getMenuItemStyles(color: string, index: number): string {
    return `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #111;
      border: 1px solid ${color}40;
      color: #fff;
      cursor: pointer;
      min-width: 160px;
      transition: all 0.2s ease;
      opacity: 0;
      transform: translateY(10px);
    `;
  }
}

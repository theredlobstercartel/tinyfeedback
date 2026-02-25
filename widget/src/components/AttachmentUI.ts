/**
 * Attachment UI Component for TinyFeedback Widget
 * Story: ST-06 - Widget Screenshot e Anexos
 * 
 * Provides UI for:
 * - Screenshot capture button
 * - File upload button
 * - Attachment preview grid
 * - Remove attachment functionality
 */

import { AttachmentHandler, AttachmentFile } from '../utils/AttachmentHandler.js';

export interface AttachmentUIOptions {
  container: HTMLElement;
  apiUrl: string;
  apiKey: string;
  projectId: string;
  onAttachmentsChange?: (attachments: AttachmentFile[]) => void;
  maxAttachments?: number;
}

export class AttachmentUI {
  private container: HTMLElement;
  private handler: AttachmentHandler;
  private options: Required<AttachmentUIOptions>;
  private attachmentContainer: HTMLElement | null = null;
  private buttonsContainer: HTMLElement | null = null;
  private errorMessage: HTMLElement | null = null;

  constructor(options: AttachmentUIOptions) {
    this.container = options.container;
    this.options = {
      maxAttachments: 5,
      onAttachmentsChange: () => {},
      ...options
    };
    
    this.handler = new AttachmentHandler({
      apiUrl: options.apiUrl,
      apiKey: options.apiKey,
      projectId: options.projectId,
      onAttachmentChange: (attachments) => {
        this.renderAttachments();
        this.options.onAttachmentsChange(attachments);
        this.updateButtonStates();
      }
    });
    
    this.createUI();
  }

  /**
   * Create the attachment UI
   */
  private createUI(): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'tf-attachment-wrapper';
    wrapper.style.cssText = this.getWrapperStyles();

    // Label
    const label = document.createElement('label');
    label.textContent = 'Anexos (máx 5MB cada)';
    label.style.cssText = this.getLabelStyles();

    // Buttons container
    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.style.cssText = this.getButtonsContainerStyles();

    // Screenshot button
    const screenshotBtn = document.createElement('button');
    screenshotBtn.type = 'button';
    screenshotBtn.className = 'tf-attachment-btn tf-screenshot-btn';
    screenshotBtn.innerHTML = '📸 Capturar Tela';
    screenshotBtn.style.cssText = this.getButtonStyles();
    screenshotBtn.addEventListener('click', () => this.handleScreenshot());

    // Upload button
    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'tf-attachment-btn tf-upload-btn';
    uploadBtn.innerHTML = '📎 Anexar Arquivo';
    uploadBtn.style.cssText = this.getButtonStyles();
    uploadBtn.addEventListener('click', () => this.handler.triggerFileUpload());

    this.buttonsContainer.appendChild(screenshotBtn);
    this.buttonsContainer.appendChild(uploadBtn);

    // Error message container
    this.errorMessage = document.createElement('div');
    this.errorMessage.style.cssText = this.getErrorStyles();
    this.errorMessage.style.display = 'none';

    // Attachments preview container
    this.attachmentContainer = document.createElement('div');
    this.attachmentContainer.className = 'tf-attachment-grid';
    this.attachmentContainer.style.cssText = this.getAttachmentGridStyles();

    wrapper.appendChild(label);
    wrapper.appendChild(this.buttonsContainer);
    wrapper.appendChild(this.errorMessage);
    wrapper.appendChild(this.attachmentContainer);

    this.container.appendChild(wrapper);
  }

  /**
   * Handle screenshot capture
   */
  private async handleScreenshot(): Promise<void> {
    this.clearError();
    
    if (this.handler.getAttachmentCount() >= this.options.maxAttachments) {
      this.showError(`Limite de ${this.options.maxAttachments} anexos atingido`);
      return;
    }

    const btn = this.buttonsContainer?.querySelector('.tf-screenshot-btn') as HTMLButtonElement;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Capturando...';
    }

    try {
      const attachment = await this.handler.captureScreenshot();
      
      if (attachment) {
        this.handler.getAttachments().push(attachment);
        this.renderAttachments();
        this.options.onAttachmentsChange(this.handler.getAttachments());
      } else {
        this.showError('Não foi possível capturar a tela. Tente anexar um arquivo manualmente.');
      }
    } catch (error) {
      this.showError('Erro ao capturar tela');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '📸 Capturar Tela';
      }
      this.updateButtonStates();
    }
  }

  /**
   * Render attachment previews
   */
  private renderAttachments(): void {
    if (!this.attachmentContainer) return;
    
    this.attachmentContainer.innerHTML = '';
    
    const attachments = this.handler.getAttachments();
    
    attachments.forEach(attachment => {
      const item = this.createAttachmentItem(attachment);
      this.attachmentContainer!.appendChild(item);
    });
  }

  /**
   * Create attachment preview item
   */
  private createAttachmentItem(attachment: AttachmentFile): HTMLElement {
    const item = document.createElement('div');
    item.className = 'tf-attachment-item';
    item.style.cssText = this.getAttachmentItemStyles();
    item.dataset.id = attachment.id;

    // Image preview
    const img = document.createElement('img');
    img.src = attachment.previewUrl;
    img.alt = attachment.name;
    img.style.cssText = this.getAttachmentImageStyles();

    // Overlay with remove button
    const overlay = document.createElement('div');
    overlay.style.cssText = this.getAttachmentOverlayStyles();

    // File name
    const nameLabel = document.createElement('span');
    nameLabel.textContent = this.truncateFilename(attachment.name);
    nameLabel.style.cssText = this.getAttachmentNameStyles();

    // Size label
    const sizeLabel = document.createElement('span');
    sizeLabel.textContent = this.handler.formatFileSize(attachment.size);
    sizeLabel.style.cssText = this.getAttachmentSizeStyles();

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.innerHTML = '×';
    removeBtn.style.cssText = this.getRemoveButtonStyles();
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handler.removeAttachment(attachment.id);
    });

    overlay.appendChild(nameLabel);
    overlay.appendChild(sizeLabel);
    overlay.appendChild(removeBtn);

    item.appendChild(img);
    item.appendChild(overlay);

    return item;
  }

  /**
   * Update button states based on attachment count
   */
  private updateButtonStates(): void {
    const buttons = this.buttonsContainer?.querySelectorAll('.tf-attachment-btn');
    const isFull = this.handler.getAttachmentCount() >= this.options.maxAttachments;
    
    buttons?.forEach(btn => {
      (btn as HTMLButtonElement).disabled = isFull;
      (btn as HTMLButtonElement).style.opacity = isFull ? '0.5' : '1';
      (btn as HTMLButtonElement).style.cursor = isFull ? 'not-allowed' : 'pointer';
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.style.display = 'block';
      
      // Auto-hide after 5 seconds
      setTimeout(() => this.clearError(), 5000);
    }
  }

  /**
   * Clear error message
   */
  private clearError(): void {
    if (this.errorMessage) {
      this.errorMessage.textContent = '';
      this.errorMessage.style.display = 'none';
    }
  }

  /**
   * Truncate filename for display
   */
  private truncateFilename(name: string, maxLength: number = 15): string {
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop();
    const base = name.substring(0, maxLength - 4);
    return `${base}...${ext}`;
  }

  /**
   * Get attachment handler instance
   */
  public getHandler(): AttachmentHandler {
    return this.handler;
  }

  /**
   * Get current attachments
   */
  public getAttachments(): AttachmentFile[] {
    return this.handler.getAttachments();
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.handler.destroy();
  }

  // ==================== STYLES ====================

  private getWrapperStyles(): string {
    return `
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #333;
    `;
  }

  private getLabelStyles(): string {
    return `
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #fff;
      margin-bottom: 8px;
    `;
  }

  private getButtonsContainerStyles(): string {
    return `
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    `;
  }

  private getButtonStyles(): string {
    return `
      flex: 1;
      padding: 10px 12px;
      background: #1a1a1a;
      border: 1px solid #333;
      color: #fff;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    `;
  }

  private getErrorStyles(): string {
    return `
      padding: 8px 12px;
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid #ff4444;
      color: #ff4444;
      font-size: 13px;
      margin-bottom: 12px;
      border-radius: 4px;
    `;
  }

  private getAttachmentGridStyles(): string {
    return `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 8px;
    `;
  }

  private getAttachmentItemStyles(): string {
    return `
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #333;
      background: #111;
    `;
  }

  private getAttachmentImageStyles(): string {
    return `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
  }

  private getAttachmentOverlayStyles(): string {
    return `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.9));
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    `;
  }

  private getAttachmentNameStyles(): string {
    return `
      font-size: 11px;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
  }

  private getAttachmentSizeStyles(): string {
    return `
      font-size: 10px;
      color: #888;
    `;
  }

  private getRemoveButtonStyles(): string {
    return `
      position: absolute;
      top: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      background: rgba(255, 68, 68, 0.9);
      border: none;
      border-radius: 50%;
      color: #fff;
      font-size: 14px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    `;
  }
}

export { AttachmentFile };

/**
 * Modal de Bug Report - TinyFeedback Widget
 * 
 * Renderiza um modal para o usuário reportar bugs com:
 * - Campo textarea para descrição (obrigatório)
 * - Botão para anexar screenshot
 * - Preview da imagem selecionada
 * - Botão para enviar
 */

export interface BugReportData {
  content: string;
  screenshot_url?: string;
}

export interface BugReportCallbacks {
  onSubmit: (data: BugReportData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Classe para gerenciar o modal de bug report
 */
export class BugReportModal {
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private content: string = '';
  private screenshotFile: File | null = null;
  private screenshotPreview: string | null = null;
  private callbacks: BugReportCallbacks;
  private isSubmitting: boolean = false;

  constructor(callbacks: BugReportCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Renderiza o modal no DOM
   */
  render(): void {
    // Criar overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'tf-modal-overlay tf-bug-report-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Criar container do modal
    this.container = document.createElement('div');
    this.container.className = 'tf-modal-container tf-bug-report-modal';
    this.container.style.cssText = `
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 480px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: tf-modal-slide-in 0.2s ease-out;
    `;

    // Adicionar animação
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tf-modal-slide-in {
        from { opacity: 0; transform: translateY(-20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes tf-modal-slide-out {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(-20px) scale(0.95); }
      }
      .tf-modal-closing {
        animation: tf-modal-slide-out 0.2s ease-in forwards !important;
      }
    `;
    document.head.appendChild(style);

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;

    const title = document.createElement('h3');
    title.textContent = '🐛 Reportar Bug';
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    `;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      color: #6b7280;
      cursor: pointer;
      padding: 4px 8px;
      line-height: 1;
      transition: color 0.2s;
    `;
    closeButton.onmouseenter = () => closeButton.style.color = '#111827';
    closeButton.onmouseleave = () => closeButton.style.color = '#6b7280';
    closeButton.onclick = () => this.close();

    header.appendChild(title);
    header.appendChild(closeButton);

    // Body
    const body = document.createElement('div');
    body.style.cssText = `
      padding: 20px 24px;
      overflow-y: auto;
      max-height: calc(90vh - 140px);
    `;

    // Label para descrição
    const descriptionLabel = document.createElement('label');
    descriptionLabel.textContent = 'Descreva o problema *';
    descriptionLabel.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    `;

    // Textarea
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Descreva o bug em detalhes. O que aconteceu? Como reproduzir?';
    textarea.style.cssText = `
      width: 100%;
      min-height: 120px;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.5;
      resize: vertical;
      box-sizing: border-box;
      font-family: inherit;
    `;
    textarea.onfocus = () => textarea.style.borderColor = '#3b82f6';
    textarea.onblur = () => textarea.style.borderColor = '#d1d5db';
    textarea.oninput = (e) => {
      this.content = (e.target as HTMLTextAreaElement).value;
      this.updateSubmitButton();
    };

    // Área de upload de screenshot
    const screenshotSection = document.createElement('div');
    screenshotSection.style.cssText = `
      margin-top: 20px;
    `;

    const screenshotLabel = document.createElement('label');
    screenshotLabel.textContent = 'Anexar Screenshot';
    screenshotLabel.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    `;

    // Container para upload
    const uploadContainer = document.createElement('div');
    uploadContainer.style.cssText = `
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      transition: all 0.2s;
      cursor: pointer;
    `;

    // Input file escondido
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => this.handleFileSelect(e);

    // Texto do upload
    const uploadText = document.createElement('div');
    uploadText.innerHTML = '📷 <strong>Clique para anexar</strong><br><span style="font-size: 12px; color: #6b7280;">PNG, JPG ou GIF até 5MB</span>';
    uploadText.style.cssText = `
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    `;

    uploadContainer.onclick = () => fileInput.click();
    uploadContainer.onmouseenter = () => {
      uploadContainer.style.borderColor = '#3b82f6';
      uploadContainer.style.background = '#f0f9ff';
    };
    uploadContainer.onmouseleave = () => {
      uploadContainer.style.borderColor = '#d1d5db';
      uploadContainer.style.background = 'transparent';
    };

    uploadContainer.appendChild(uploadText);
    screenshotSection.appendChild(screenshotLabel);
    screenshotSection.appendChild(uploadContainer);
    screenshotSection.appendChild(fileInput);

    // Preview da imagem
    this.imagePreviewContainer = document.createElement('div');
    this.imagePreviewContainer.style.cssText = `
      margin-top: 12px;
      display: none;
    `;

    body.appendChild(descriptionLabel);
    body.appendChild(textarea);
    body.appendChild(screenshotSection);
    body.appendChild(this.imagePreviewContainer);

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    `;

    // Botão Cancelar
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancelar';
    cancelButton.style.cssText = `
      padding: 10px 20px;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    `;
    cancelButton.onmouseenter = () => {
      cancelButton.style.background = '#f9fafb';
    };
    cancelButton.onmouseleave = () => {
      cancelButton.style.background = 'white';
    };
    cancelButton.onclick = () => this.close();

    // Botão Enviar
    this.submitButton = document.createElement('button');
    this.submitButton.textContent = 'Reportar Bug';
    this.submitButton.disabled = true;
    this.submitButton.style.cssText = `
      padding: 10px 20px;
      border: none;
      background: #9ca3af;
      color: white;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: not-allowed;
      transition: all 0.2s;
    `;
    this.submitButton.onclick = () => this.handleSubmit();

    footer.appendChild(cancelButton);
    footer.appendChild(this.submitButton);

    // Montar modal
    this.container.appendChild(header);
    this.container.appendChild(body);
    this.container.appendChild(footer);
    this.overlay.appendChild(this.container);

    // Adicionar ao DOM
    document.body.appendChild(this.overlay);

    // Fechar ao clicar no overlay
    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    };

    // Focar no textarea
    setTimeout(() => textarea.focus(), 100);
  }

  private imagePreviewContainer: HTMLElement | null = null;
  private submitButton: HTMLButtonElement | null = null;

  /**
   * Atualiza o estado do botão de submit
   */
  private updateSubmitButton(): void {
    if (!this.submitButton) return;
    
    const hasContent = this.content.trim().length > 0;
    
    if (hasContent) {
      this.submitButton.disabled = false;
      this.submitButton.style.background = '#dc2626';
      this.submitButton.style.cursor = 'pointer';
    } else {
      this.submitButton.disabled = true;
      this.submitButton.style.background = '#9ca3af';
      this.submitButton.style.cursor = 'not-allowed';
    }
  }

  /**
   * Manipula a seleção de arquivo
   */
  private handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens (PNG, JPG, GIF)');
      return;
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    this.screenshotFile = file;

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.screenshotPreview = e.target?.result as string;
      this.showImagePreview();
    };
    reader.readAsDataURL(file);
  }

  /**
   * Mostra o preview da imagem selecionada
   */
  private showImagePreview(): void {
    if (!this.imagePreviewContainer || !this.screenshotPreview) return;

    this.imagePreviewContainer.innerHTML = '';
    this.imagePreviewContainer.style.display = 'block';
    this.imagePreviewContainer.style.cssText = `
      margin-top: 12px;
      position: relative;
      display: inline-block;
      max-width: 100%;
    `;

    const img = document.createElement('img');
    img.src = this.screenshotPreview;
    img.style.cssText = `
      max-width: 100%;
      max-height: 200px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    `;

    // Botão remover
    const removeButton = document.createElement('button');
    removeButton.innerHTML = '✕';
    removeButton.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #ef4444;
      color: white;
      border: 2px solid white;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    removeButton.onclick = () => this.removeScreenshot();

    this.imagePreviewContainer.appendChild(img);
    this.imagePreviewContainer.appendChild(removeButton);
  }

  /**
   * Remove a screenshot selecionada
   */
  private removeScreenshot(): void {
    this.screenshotFile = null;
    this.screenshotPreview = null;
    if (this.imagePreviewContainer) {
      this.imagePreviewContainer.innerHTML = '';
      this.imagePreviewContainer.style.display = 'none';
    }
  }

  /**
   * Manipula o envio do formulário
   */
  private async handleSubmit(): Promise<void> {
    if (this.isSubmitting || !this.submitButton) return;
    if (!this.content.trim()) return;

    this.isSubmitting = true;
    this.submitButton.textContent = 'Enviando...';
    this.submitButton.disabled = true;
    this.submitButton.style.opacity = '0.7';

    try {
      const data: BugReportData = {
        content: this.content.trim(),
      };

      // Se houver screenshot, converter para base64
      if (this.screenshotPreview) {
        data.screenshot_url = this.screenshotPreview;
      }

      await this.callbacks.onSubmit(data);
      this.close();
    } catch (error) {
      console.error('Erro ao enviar bug report:', error);
      alert('Erro ao enviar. Tente novamente.');
      
      // Restaurar botão
      this.isSubmitting = false;
      this.submitButton.textContent = 'Reportar Bug';
      this.updateSubmitButton();
      this.submitButton.style.opacity = '1';
    }
  }

  /**
   * Fecha o modal
   */
  close(): void {
    if (this.container) {
      this.container.classList.add('tf-modal-closing');
    }

    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.callbacks.onCancel();
    }, 200);
  }

  /**
   * Retorna o arquivo de screenshot selecionado
   */
  getScreenshotFile(): File | null {
    return this.screenshotFile;
  }
}

/**
 * Função helper para criar e renderizar o modal
 */
export function createBugReportModal(callbacks: BugReportCallbacks): BugReportModal {
  const modal = new BugReportModal(callbacks);
  modal.render();
  return modal;
}

export default BugReportModal;

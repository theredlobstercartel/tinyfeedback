var TinyFeedback = (function (exports) {
    'use strict';

    /**
     * NPS Modal Component
     * Story: ST-06 - Implementar Modal de NPS
     */
    class NPSModal {
        constructor(options) {
            this.container = null;
            this.selectedScore = null;
            this.options = options;
        }
        /**
         * Open the NPS modal
         */
        open() {
            this.createModal();
            this.attachEventListeners();
        }
        /**
         * Close the NPS modal
         */
        close() {
            if (this.container) {
                this.container.remove();
                this.container = null;
            }
            this.options.onClose?.();
        }
        /**
         * Create the modal DOM structure
         */
        createModal() {
            // Create container
            this.container = document.createElement('div');
            this.container.id = 'tf-nps-modal';
            this.container.style.cssText = this.getContainerStyles();
            // Create modal content
            const modal = document.createElement('div');
            modal.id = 'tf-nps-content';
            modal.style.cssText = this.getModalStyles();
            // Header
            const header = document.createElement('div');
            header.style.cssText = this.getHeaderStyles();
            header.innerHTML = `
      <h3 style="${this.getTitleStyles()}">How likely are you to recommend us?</h3>
      <p style="${this.getSubtitleStyles()}">Rate from 0 (not likely) to 10 (very likely)</p>
    `;
            // Scale container
            const scaleContainer = document.createElement('div');
            scaleContainer.id = 'tf-nps-scale';
            scaleContainer.style.cssText = this.getScaleContainerStyles();
            // Create rating buttons 0-10
            for (let i = 0; i <= 10; i++) {
                const button = this.createRatingButton(i);
                scaleContainer.appendChild(button);
            }
            // Comment section (hidden initially)
            const commentSection = document.createElement('div');
            commentSection.id = 'tf-nps-comment-section';
            commentSection.style.cssText = this.getCommentSectionStyles();
            commentSection.style.display = 'none';
            commentSection.innerHTML = `
      <textarea 
        id="tf-nps-comment" 
        placeholder="Tell us more about your experience (optional)"
        style="${this.getTextareaStyles()}"
      ></textarea>
    `;
            // Submit button
            const submitButton = document.createElement('button');
            submitButton.id = 'tf-nps-submit';
            submitButton.textContent = 'Send Feedback';
            submitButton.style.cssText = this.getSubmitButtonStyles();
            submitButton.style.display = 'none';
            // Close button
            const closeButton = document.createElement('button');
            closeButton.id = 'tf-nps-close';
            closeButton.textContent = '×';
            closeButton.style.cssText = this.getCloseButtonStyles();
            // Assemble modal
            modal.appendChild(closeButton);
            modal.appendChild(header);
            modal.appendChild(scaleContainer);
            modal.appendChild(commentSection);
            modal.appendChild(submitButton);
            this.container.appendChild(modal);
            // Add to document
            document.body.appendChild(this.container);
        }
        /**
         * Create a rating button
         */
        createRatingButton(score) {
            const button = document.createElement('button');
            button.className = 'tf-nps-rating-btn';
            button.dataset.score = score.toString();
            button.textContent = score.toString();
            button.style.cssText = this.getRatingButtonStyles(score);
            return button;
        }
        /**
         * Attach event listeners
         */
        attachEventListeners() {
            if (!this.container)
                return;
            // Rating buttons
            const ratingButtons = this.container.querySelectorAll('.tf-nps-rating-btn');
            ratingButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const score = parseInt(e.target.dataset.score || '0');
                    this.selectScore(score);
                });
            });
            // Submit button
            const submitBtn = this.container.querySelector('#tf-nps-submit');
            submitBtn?.addEventListener('click', () => this.submit());
            // Close button
            const closeBtn = this.container.querySelector('#tf-nps-close');
            closeBtn?.addEventListener('click', () => this.close());
            // Close on backdrop click
            this.container.addEventListener('click', (e) => {
                if (e.target === this.container) {
                    this.close();
                }
            });
        }
        /**
         * Select a score
         */
        selectScore(score) {
            this.selectedScore = score;
            // Update button styles
            const buttons = this.container?.querySelectorAll('.tf-nps-rating-btn');
            buttons?.forEach(btn => {
                const btnScore = parseInt(btn.dataset.score || '0');
                if (btnScore === score) {
                    btn.style.cssText = this.getSelectedRatingButtonStyles(score);
                }
                else {
                    btn.style.cssText = this.getRatingButtonStyles(btnScore);
                }
            });
            // Show comment section and submit button
            const commentSection = this.container?.querySelector('#tf-nps-comment-section');
            const submitButton = this.container?.querySelector('#tf-nps-submit');
            if (commentSection)
                commentSection.style.display = 'block';
            if (submitButton)
                submitButton.style.display = 'block';
        }
        /**
         * Submit the NPS feedback
         */
        async submit() {
            if (this.selectedScore === null)
                return;
            const commentTextarea = this.container?.querySelector('#tf-nps-comment');
            const comment = commentTextarea?.value?.trim();
            try {
                const response = await fetch(`${this.options.apiUrl}/api/widget/feedback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.options.apiKey
                    },
                    body: JSON.stringify({
                        project_id: this.options.projectId,
                        type: 'nps',
                        nps_score: this.selectedScore,
                        content: comment || '',
                        page_url: window.location.href,
                        user_agent: navigator.userAgent
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    // AC-02: Show warning if approaching limit
                    if (data.warning) {
                        this.showWarning(data.warning.message, data.warning.detail);
                        // Still close after showing warning briefly
                        setTimeout(() => this.close(), 3000);
                        return;
                    }
                    this.showThankYou();
                    this.options.onSubmit?.(this.selectedScore, comment);
                }
                else if (response.status === 429) {
                    // AC-03: Handle limit reached
                    const errorData = await response.json();
                    if (errorData.error === 'LIMIT_REACHED') {
                        this.showLimitReached(errorData.message);
                    }
                    else {
                        alert('Failed to submit feedback. Please try again.');
                    }
                }
                else {
                    console.error('Failed to submit NPS feedback');
                    alert('Failed to submit feedback. Please try again.');
                }
            }
            catch (error) {
                console.error('Error submitting NPS:', error);
                alert('Failed to submit feedback. Please try again.');
            }
        }
        /**
         * Show warning message
         */
        showWarning(title, detail) {
            if (!this.container)
                return;
            const modal = this.container.querySelector('#tf-nps-content');
            if (modal) {
                modal.innerHTML = `
        <div style="${this.getWarningStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h3 style="${this.getTitleStyles()}">${title}</h3>
          <p style="${this.getSubtitleStyles()}">${detail}</p>
        </div>
      `;
            }
        }
        /**
         * Show limit reached message (AC-03)
         */
        showLimitReached(message) {
            if (!this.container)
                return;
            const modal = this.container.querySelector('#tf-nps-content');
            if (modal) {
                modal.innerHTML = `
        <div style="${this.getLimitReachedStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">🚫</div>
          <h3 style="${this.getTitleStyles()}">Limite Atingido</h3>
          <p style="${this.getSubtitleStyles()}">${message}</p>
          <button 
            onclick="window.open('/billing', '_blank')"
            style="${this.getUpgradeButtonStyles()}"
          >
            Fazer Upgrade
          </button>
        </div>
      `;
            }
            // Auto close after 5 seconds
            setTimeout(() => this.close(), 5000);
        }
        getWarningStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ffaa00;
      background: rgba(255, 170, 0, 0.1);
    `;
        }
        getLimitReachedStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ff4444;
      background: rgba(255, 68, 68, 0.1);
    `;
        }
        getUpgradeButtonStyles() {
            return `
      margin-top: 20px;
      padding: 12px 24px;
      background: #ffd700;
      color: #000;
      border: none;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
        }
        /**
         * Show thank you message
         */
        showThankYou() {
            if (!this.container)
                return;
            const modal = this.container.querySelector('#tf-nps-content');
            if (modal) {
                modal.innerHTML = `
        <div style="${this.getThankYouStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
          <h3 style="${this.getTitleStyles()}">Thank you!</h3>
          <p style="${this.getSubtitleStyles()}">Your feedback helps us improve.</p>
        </div>
      `;
            }
            // Auto close after 2 seconds
            setTimeout(() => this.close(), 2000);
        }
        // ==================== STYLES ====================
        getContainerStyles() {
            return `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
        }
        getModalStyles() {
            return `
      background: #000;
      border: 1px solid #333;
      padding: 32px;
      max-width: 500px;
      width: 90%;
      position: relative;
      box-shadow: 0 0 40px rgba(0, 255, 136, 0.1);
    `;
        }
        getHeaderStyles() {
            return `
      text-align: center;
      margin-bottom: 24px;
    `;
        }
        getTitleStyles() {
            return `
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #fff;
    `;
        }
        getSubtitleStyles() {
            return `
      margin: 0;
      font-size: 14px;
      color: #888;
    `;
        }
        getScaleContainerStyles() {
            return `
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    `;
        }
        getRatingButtonStyles(score) {
            const color = this.getScoreColor(score);
            return `
      width: 36px;
      height: 36px;
      border: 1px solid ${color};
      background: transparent;
      color: ${color};
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
        }
        getSelectedRatingButtonStyles(score) {
            const color = this.getScoreColor(score);
            return `
      width: 36px;
      height: 36px;
      border: 1px solid ${color};
      background: ${color};
      color: #000;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px ${color}80;
    `;
        }
        getScoreColor(score) {
            // AC-03: Color coding - 0-6 red, 7-8 yellow, 9-10 green
            if (score <= 6)
                return '#ff4444'; // Red for detractors
            if (score <= 8)
                return '#ffaa00'; // Yellow for passives
            return '#00ff88'; // Green for promoters
        }
        getCommentSectionStyles() {
            return `
      margin-bottom: 20px;
    `;
        }
        getTextareaStyles() {
            return `
      width: 100%;
      min-height: 80px;
      padding: 12px;
      border: 1px solid #333;
      background: #111;
      color: #fff;
      font-size: 14px;
      resize: vertical;
      box-sizing: border-box;
      font-family: inherit;
    `;
        }
        getSubmitButtonStyles() {
            return `
      width: 100%;
      padding: 14px;
      background: #00ff88;
      color: #000;
      border: none;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
        }
        getCloseButtonStyles() {
            return `
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      background: transparent;
      border: none;
      color: #888;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
        }
        getThankYouStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
    `;
        }
    }

    /**
     * Attachment Handler for TinyFeedback Widget
     * Story: ST-06 - Widget Screenshot e Anexos
     *
     * Features:
     * - Screenshot capture using native APIs
     * - File attachment upload (images up to 5MB)
     * - Preview before sending
     * - Integration with Supabase Storage
     */
    const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    class AttachmentHandler {
        constructor(options) {
            this.attachments = [];
            this.fileInput = null;
            this.options = {
                maxFileSize: DEFAULT_MAX_FILE_SIZE,
                allowedTypes: DEFAULT_ALLOWED_TYPES,
                onAttachmentChange: () => { },
                ...options
            };
            this.createFileInput();
        }
        /**
         * Get current attachments
         */
        getAttachments() {
            return [...this.attachments];
        }
        /**
         * Get attachment count
         */
        getAttachmentCount() {
            return this.attachments.length;
        }
        /**
         * Clear all attachments
         */
        clearAttachments() {
            this.attachments.forEach(att => {
                if (att.previewUrl && att.previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(att.previewUrl);
                }
            });
            this.attachments = [];
            this.notifyChange();
        }
        /**
         * Remove a specific attachment
         */
        removeAttachment(id) {
            const attachment = this.attachments.find(a => a.id === id);
            if (attachment && attachment.previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(attachment.previewUrl);
            }
            this.attachments = this.attachments.filter(a => a.id !== id);
            this.notifyChange();
        }
        /**
         * Capture screenshot of current page
         */
        async captureScreenshot() {
            try {
                // Use native screenshot API if available (Screen Capture API)
                if ('mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices) {
                    const stream = await navigator.mediaDevices.getDisplayMedia({
                        video: { cursor: 'always' },
                        audio: false
                    });
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    return new Promise((resolve) => {
                        video.onloadedmetadata = () => {
                            video.play();
                            // Wait a moment for the video to start playing
                            setTimeout(() => {
                                const canvas = document.createElement('canvas');
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                    ctx.drawImage(video, 0, 0);
                                    // Stop all tracks
                                    stream.getTracks().forEach(track => track.stop());
                                    canvas.toBlob((blob) => {
                                        if (blob) {
                                            const file = new File([blob], `screenshot-${Date.now()}.png`, {
                                                type: 'image/png'
                                            });
                                            const attachment = this.createAttachment(file, 'screenshot');
                                            resolve(attachment);
                                        }
                                        else {
                                            resolve(null);
                                        }
                                    }, 'image/png');
                                }
                                else {
                                    stream.getTracks().forEach(track => track.stop());
                                    resolve(null);
                                }
                            }, 500);
                        };
                        video.onerror = () => {
                            stream.getTracks().forEach(track => track.stop());
                            resolve(null);
                        };
                    });
                }
                else {
                    // Fallback: capture visible viewport using html2canvas-like approach
                    return this.captureViewportScreenshot();
                }
            }
            catch (error) {
                console.warn('[TinyFeedback] Screenshot capture failed:', error);
                return null;
            }
        }
        /**
         * Fallback viewport screenshot using DOM-to-image approach
         */
        async captureViewportScreenshot() {
            try {
                // Create a canvas and draw the visible viewport
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx)
                    return null;
                const width = window.innerWidth;
                const height = window.innerHeight;
                canvas.width = Math.min(width, 1920); // Max width
                canvas.height = Math.min(height, 1080); // Max height
                // Fill with page background color
                const bodyBg = window.getComputedStyle(document.body).backgroundColor;
                ctx.fillStyle = bodyBg || '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                // Add page URL and timestamp
                ctx.fillStyle = '#333333';
                ctx.font = '14px sans-serif';
                ctx.fillText(`URL: ${window.location.href}`, 10, 30);
                ctx.fillText(`Captured: ${new Date().toLocaleString()}`, 10, 50);
                ctx.fillText('(Viewport capture - for full page screenshot use browser tools)', 10, 70);
                return new Promise((resolve) => {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const file = new File([blob], `viewport-${Date.now()}.png`, {
                                type: 'image/png'
                            });
                            const attachment = this.createAttachment(file, 'screenshot');
                            resolve(attachment);
                        }
                        else {
                            resolve(null);
                        }
                    }, 'image/png', 0.8);
                });
            }
            catch (error) {
                console.warn('[TinyFeedback] Viewport capture failed:', error);
                return null;
            }
        }
        /**
         * Trigger file input for manual upload
         */
        triggerFileUpload() {
            this.fileInput?.click();
        }
        /**
         * Handle file selection
         */
        handleFileSelect(event) {
            const input = event.target;
            const files = input.files;
            if (!files || files.length === 0)
                return;
            Array.from(files).forEach(file => {
                const error = this.validateFile(file);
                if (error) {
                    console.warn(`[TinyFeedback] File rejected: ${error}`);
                    return;
                }
                const attachment = this.createAttachment(file, 'upload');
                this.attachments.push(attachment);
            });
            this.notifyChange();
            // Reset input
            input.value = '';
        }
        /**
         * Validate file
         */
        validateFile(file) {
            if (file.size > this.options.maxFileSize) {
                return `File too large (max ${this.formatFileSize(this.options.maxFileSize)})`;
            }
            if (!this.options.allowedTypes.includes(file.type)) {
                return `Invalid file type (allowed: ${this.options.allowedTypes.join(', ')})`;
            }
            return null;
        }
        /**
         * Create attachment object from file
         */
        createAttachment(file, type) {
            const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const previewUrl = URL.createObjectURL(file);
            return {
                id,
                file,
                previewUrl,
                type,
                name: file.name,
                size: file.size
            };
        }
        /**
         * Create hidden file input element
         */
        createFileInput() {
            this.fileInput = document.createElement('input');
            this.fileInput.type = 'file';
            this.fileInput.accept = this.options.allowedTypes.join(',');
            this.fileInput.multiple = true;
            this.fileInput.style.display = 'none';
            this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
            document.body.appendChild(this.fileInput);
        }
        /**
         * Notify listeners of attachment changes
         */
        notifyChange() {
            this.options.onAttachmentChange([...this.attachments]);
        }
        /**
         * Format file size for display
         */
        formatFileSize(bytes) {
            if (bytes === 0)
                return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        /**
         * Upload attachments to Supabase Storage
         */
        async uploadAttachments() {
            const urls = [];
            const errors = [];
            for (const attachment of this.attachments) {
                if (!attachment.file) {
                    // Screenshot captured via API won't have a File object yet
                    continue;
                }
                try {
                    const formData = new FormData();
                    formData.append('file', attachment.file);
                    formData.append('projectId', this.options.projectId);
                    formData.append('type', attachment.type);
                    const response = await fetch(`${this.options.apiUrl}/api/widget/upload`, {
                        method: 'POST',
                        headers: {
                            'X-API-Key': this.options.apiKey
                        },
                        body: formData
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.url) {
                            urls.push(data.url);
                        }
                    }
                    else {
                        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
                        errors.push(`${attachment.name}: ${errorData.error || 'Upload failed'}`);
                    }
                }
                catch (error) {
                    errors.push(`${attachment.name}: Network error`);
                }
            }
            return { urls, errors };
        }
        /**
         * Clean up resources
         */
        destroy() {
            this.clearAttachments();
            if (this.fileInput) {
                this.fileInput.remove();
                this.fileInput = null;
            }
        }
    }

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
    class AttachmentUI {
        constructor(options) {
            this.attachmentContainer = null;
            this.buttonsContainer = null;
            this.errorMessage = null;
            this.container = options.container;
            this.options = {
                maxAttachments: 5,
                onAttachmentsChange: () => { },
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
        createUI() {
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
        async handleScreenshot() {
            this.clearError();
            if (this.handler.getAttachmentCount() >= this.options.maxAttachments) {
                this.showError(`Limite de ${this.options.maxAttachments} anexos atingido`);
                return;
            }
            const btn = this.buttonsContainer?.querySelector('.tf-screenshot-btn');
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
                }
                else {
                    this.showError('Não foi possível capturar a tela. Tente anexar um arquivo manualmente.');
                }
            }
            catch (error) {
                this.showError('Erro ao capturar tela');
            }
            finally {
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
        renderAttachments() {
            if (!this.attachmentContainer)
                return;
            this.attachmentContainer.innerHTML = '';
            const attachments = this.handler.getAttachments();
            attachments.forEach(attachment => {
                const item = this.createAttachmentItem(attachment);
                this.attachmentContainer.appendChild(item);
            });
        }
        /**
         * Create attachment preview item
         */
        createAttachmentItem(attachment) {
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
        updateButtonStates() {
            const buttons = this.buttonsContainer?.querySelectorAll('.tf-attachment-btn');
            const isFull = this.handler.getAttachmentCount() >= this.options.maxAttachments;
            buttons?.forEach(btn => {
                btn.disabled = isFull;
                btn.style.opacity = isFull ? '0.5' : '1';
                btn.style.cursor = isFull ? 'not-allowed' : 'pointer';
            });
        }
        /**
         * Show error message
         */
        showError(message) {
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
        clearError() {
            if (this.errorMessage) {
                this.errorMessage.textContent = '';
                this.errorMessage.style.display = 'none';
            }
        }
        /**
         * Truncate filename for display
         */
        truncateFilename(name, maxLength = 15) {
            if (name.length <= maxLength)
                return name;
            const ext = name.split('.').pop();
            const base = name.substring(0, maxLength - 4);
            return `${base}...${ext}`;
        }
        /**
         * Get attachment handler instance
         */
        getHandler() {
            return this.handler;
        }
        /**
         * Get current attachments
         */
        getAttachments() {
            return this.handler.getAttachments();
        }
        /**
         * Clean up resources
         */
        destroy() {
            this.handler.destroy();
        }
        // ==================== STYLES ====================
        getWrapperStyles() {
            return `
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #333;
    `;
        }
        getLabelStyles() {
            return `
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #fff;
      margin-bottom: 8px;
    `;
        }
        getButtonsContainerStyles() {
            return `
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    `;
        }
        getButtonStyles() {
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
        getErrorStyles() {
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
        getAttachmentGridStyles() {
            return `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 8px;
    `;
        }
        getAttachmentItemStyles() {
            return `
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #333;
      background: #111;
    `;
        }
        getAttachmentImageStyles() {
            return `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
        }
        getAttachmentOverlayStyles() {
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
        getAttachmentNameStyles() {
            return `
      font-size: 11px;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
        }
        getAttachmentSizeStyles() {
            return `
      font-size: 10px;
      color: #888;
    `;
        }
        getRemoveButtonStyles() {
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

    /**
     * Suggestion Modal Component with Attachments
     * Story: ST-07 - Implementar Modal de Sugestão
     * Story: ST-06 - Widget Screenshot e Anexos
     */
    class SuggestionModal {
        constructor(options) {
            this.container = null;
            this.titleInput = null;
            this.descriptionTextarea = null;
            this.attachmentUI = null;
            this.options = options;
        }
        /**
         * Open the Suggestion modal
         */
        open() {
            this.createModal();
            this.attachEventListeners();
            // Focus on title input after opening
            setTimeout(() => this.titleInput?.focus(), 100);
        }
        /**
         * Close the Suggestion modal
         */
        close() {
            if (this.container) {
                this.container.remove();
                this.container = null;
            }
            this.attachmentUI?.destroy();
            this.attachmentUI = null;
            this.options.onClose?.();
        }
        /**
         * Create the modal DOM structure
         */
        createModal() {
            // Create container
            this.container = document.createElement('div');
            this.container.id = 'tf-suggestion-modal';
            this.container.style.cssText = this.getContainerStyles();
            // Create modal content
            const modal = document.createElement('div');
            modal.id = 'tf-suggestion-content';
            modal.style.cssText = this.getModalStyles();
            // Close button
            const closeButton = document.createElement('button');
            closeButton.id = 'tf-suggestion-close';
            closeButton.textContent = '×';
            closeButton.style.cssText = this.getCloseButtonStyles();
            // Header
            const header = document.createElement('div');
            header.style.cssText = this.getHeaderStyles();
            header.innerHTML = `
      <h3 style="${this.getTitleStyles()}">💡 Sugestão de Feature</h3>
      <p style="${this.getSubtitleStyles()}">Tem uma ideia para melhorar nosso produto? Conta pra gente!</p>
    `;
            // Form container
            const formContainer = document.createElement('form');
            formContainer.id = 'tf-suggestion-form';
            formContainer.style.cssText = this.getFormStyles();
            // Title field (required)
            const titleGroup = document.createElement('div');
            titleGroup.style.cssText = this.getFieldGroupStyles();
            const titleLabel = document.createElement('label');
            titleLabel.htmlFor = 'tf-suggestion-title';
            titleLabel.style.cssText = this.getLabelStyles();
            titleLabel.innerHTML = 'Título da sugestão <span style="color: #ff4444;">*</span>';
            this.titleInput = document.createElement('input');
            this.titleInput.id = 'tf-suggestion-title';
            this.titleInput.type = 'text';
            this.titleInput.placeholder = 'Ex: Adicionar modo escuro';
            this.titleInput.required = true;
            this.titleInput.style.cssText = this.getInputStyles();
            titleGroup.appendChild(titleLabel);
            titleGroup.appendChild(this.titleInput);
            // Description field (optional)
            const descriptionGroup = document.createElement('div');
            descriptionGroup.style.cssText = this.getFieldGroupStyles();
            const descriptionLabel = document.createElement('label');
            descriptionLabel.htmlFor = 'tf-suggestion-description';
            descriptionLabel.style.cssText = this.getLabelStyles();
            descriptionLabel.textContent = 'Descrição (opcional)';
            this.descriptionTextarea = document.createElement('textarea');
            this.descriptionTextarea.id = 'tf-suggestion-description';
            this.descriptionTextarea.placeholder = 'Descreva sua sugestão em detalhes...';
            this.descriptionTextarea.style.cssText = this.getTextareaStyles();
            descriptionGroup.appendChild(descriptionLabel);
            descriptionGroup.appendChild(this.descriptionTextarea);
            // Attachment UI container
            const attachmentContainer = document.createElement('div');
            attachmentContainer.id = 'tf-suggestion-attachments';
            // Submit button
            const submitButton = document.createElement('button');
            submitButton.id = 'tf-suggestion-submit';
            submitButton.type = 'submit';
            submitButton.textContent = 'Enviar Sugestão';
            submitButton.style.cssText = this.getSubmitButtonStyles();
            // Assemble form
            formContainer.appendChild(titleGroup);
            formContainer.appendChild(descriptionGroup);
            formContainer.appendChild(attachmentContainer);
            formContainer.appendChild(submitButton);
            // Assemble modal
            modal.appendChild(closeButton);
            modal.appendChild(header);
            modal.appendChild(formContainer);
            this.container.appendChild(modal);
            // Add to document
            document.body.appendChild(this.container);
            // Initialize Attachment UI after modal is in DOM
            this.attachmentUI = new AttachmentUI({
                container: attachmentContainer,
                apiUrl: this.options.apiUrl,
                apiKey: this.options.apiKey,
                projectId: this.options.projectId,
                maxAttachments: 5
            });
        }
        /**
         * Attach event listeners
         */
        attachEventListeners() {
            if (!this.container)
                return;
            // Form submission
            const form = this.container.querySelector('#tf-suggestion-form');
            form?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submit();
            });
            // Close button
            const closeBtn = this.container.querySelector('#tf-suggestion-close');
            closeBtn?.addEventListener('click', () => this.close());
            // Close on backdrop click
            this.container.addEventListener('click', (e) => {
                if (e.target === this.container) {
                    this.close();
                }
            });
            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.container) {
                    this.close();
                }
            });
        }
        /**
         * Submit the suggestion
         */
        async submit() {
            if (!this.titleInput)
                return;
            const title = this.titleInput.value.trim();
            const description = this.descriptionTextarea?.value?.trim() || '';
            // AC-01: Validate title is required
            if (!title) {
                this.showError('O título é obrigatório');
                this.titleInput?.focus();
                return;
            }
            // Show loading state
            const submitBtn = this.container?.querySelector('#tf-suggestion-submit');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';
            }
            try {
                // Upload attachments first if any
                let attachmentUrls = [];
                if (this.attachmentUI && this.attachmentUI.getAttachments().length > 0) {
                    const handler = this.attachmentUI.getHandler();
                    const { urls, errors } = await handler.uploadAttachments();
                    if (errors.length > 0) {
                        console.warn('[TinyFeedback] Some attachments failed:', errors);
                    }
                    attachmentUrls = urls;
                }
                const response = await fetch(`${this.options.apiUrl}/api/widget/feedback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.options.apiKey
                    },
                    body: JSON.stringify({
                        project_id: this.options.projectId,
                        type: 'suggestion',
                        title: title,
                        content: description,
                        page_url: window.location.href,
                        user_agent: navigator.userAgent,
                        screenshot_url: attachmentUrls.length > 0 ? attachmentUrls[0] : null,
                        attachment_urls: attachmentUrls
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    // AC-02: Show warning if approaching limit
                    if (data.warning) {
                        this.showWarning(data.warning.message, data.warning.detail);
                        // Still close after showing warning briefly
                        setTimeout(() => this.close(), 3000);
                        return;
                    }
                    this.showThankYou();
                    this.options.onSubmit?.(title, description || undefined, attachmentUrls);
                }
                else if (response.status === 429) {
                    // AC-03: Handle limit reached
                    const errorData = await response.json();
                    if (errorData.error === 'LIMIT_REACHED') {
                        this.showLimitReached(errorData.message);
                    }
                    else {
                        this.showError('Falha ao enviar sugestão. Tente novamente.');
                    }
                }
                else {
                    console.error('Failed to submit suggestion');
                    this.showError('Falha ao enviar sugestão. Tente novamente.');
                }
            }
            catch (error) {
                console.error('Error submitting suggestion:', error);
                this.showError('Falha ao enviar sugestão. Tente novamente.');
            }
            finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Enviar Sugestão';
                }
            }
        }
        /**
         * Show warning message
         */
        showWarning(title, detail) {
            if (!this.container)
                return;
            const modal = this.container.querySelector('#tf-suggestion-content');
            if (modal) {
                modal.innerHTML = `
        <div style="${this.getWarningStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h3 style="${this.getTitleStyles()}">${title}</h3>
          <p style="${this.getSubtitleStyles()}">${detail}</p>
        </div>
      `;
            }
        }
        /**
         * Show limit reached message (AC-03)
         */
        showLimitReached(message) {
            if (!this.container)
                return;
            const modal = this.container.querySelector('#tf-suggestion-content');
            if (modal) {
                modal.innerHTML = `
        <div style="${this.getLimitReachedStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">🚫</div>
          <h3 style="${this.getTitleStyles()}">Limite Atingido</h3>
          <p style="${this.getSubtitleStyles()}">${message}</p>
          <button 
            onclick="window.open('/billing', '_blank')"
            style="${this.getUpgradeButtonStyles()}"
          >
            Fazer Upgrade
          </button>
        </div>
      `;
            }
            // Auto close after 5 seconds
            setTimeout(() => this.close(), 5000);
        }
        /**
         * Show error message
         */
        showError(message) {
            // Remove any existing error
            const existingError = this.container?.querySelector('#tf-suggestion-error');
            existingError?.remove();
            const errorDiv = document.createElement('div');
            errorDiv.id = 'tf-suggestion-error';
            errorDiv.style.cssText = this.getErrorStyles();
            errorDiv.textContent = message;
            const form = this.container?.querySelector('#tf-suggestion-form');
            form?.insertBefore(errorDiv, form.firstChild);
        }
        /**
         * Show thank you message
         */
        showThankYou() {
            if (!this.container)
                return;
            const modal = this.container.querySelector('#tf-suggestion-content');
            if (modal) {
                modal.innerHTML = `
        <div style="${this.getThankYouStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
          <h3 style="${this.getTitleStyles()}">Obrigado!</h3>
          <p style="${this.getSubtitleStyles()}">Sua sugestão foi enviada com sucesso.</p>
        </div>
      `;
            }
            // Auto close after 2 seconds
            setTimeout(() => this.close(), 2000);
        }
        // ==================== STYLES ====================
        getContainerStyles() {
            return `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
        }
        getModalStyles() {
            return `
      background: #000;
      border: 1px solid #333;
      padding: 32px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 0 40px rgba(0, 255, 136, 0.1);
    `;
        }
        getCloseButtonStyles() {
            return `
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      background: transparent;
      border: none;
      color: #888;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s ease;
    `;
        }
        getHeaderStyles() {
            return `
      text-align: center;
      margin-bottom: 24px;
    `;
        }
        getTitleStyles() {
            return `
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #fff;
    `;
        }
        getSubtitleStyles() {
            return `
      margin: 0;
      font-size: 14px;
      color: #888;
    `;
        }
        getFormStyles() {
            return `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;
        }
        getFieldGroupStyles() {
            return `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
        }
        getLabelStyles() {
            return `
      font-size: 14px;
      font-weight: 500;
      color: #fff;
    `;
        }
        getInputStyles() {
            return `
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #333;
      background: #111;
      color: #fff;
      font-size: 14px;
      box-sizing: border-box;
      font-family: inherit;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    `;
        }
        getTextareaStyles() {
            return `
      width: 100%;
      min-height: 120px;
      padding: 12px 16px;
      border: 1px solid #333;
      background: #111;
      color: #fff;
      font-size: 14px;
      resize: vertical;
      box-sizing: border-box;
      font-family: inherit;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    `;
        }
        getSubmitButtonStyles() {
            return `
      width: 100%;
      padding: 14px;
      margin-top: 8px;
      background: #00ff88;
      color: #000;
      border: none;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
        }
        getErrorStyles() {
            return `
      padding: 12px 16px;
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid #ff4444;
      color: #ff4444;
      font-size: 14px;
      margin-bottom: 16px;
    `;
        }
        getThankYouStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
    `;
        }
        getWarningStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ffaa00;
      background: rgba(255, 170, 0, 0.1);
    `;
        }
        getLimitReachedStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ff4444;
      background: rgba(255, 68, 68, 0.1);
    `;
        }
        getUpgradeButtonStyles() {
            return `
      margin-top: 20px;
      padding: 12px 24px;
      background: #ffd700;
      color: #000;
      border: none;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
        }
    }

    /**
     * Bug Report Modal Component with Attachments
     * Story: ST-05 - Criar Widget Vanilla JS
     * Story: ST-06 - Widget Screenshot e Anexos
     */
    class BugModal {
        constructor(options) {
            this.container = null;
            this.titleInput = null;
            this.descriptionTextarea = null;
            this.selectedSeverity = 'medium';
            this.attachmentUI = null;
            this.options = options;
        }
        /**
         * Open the Bug modal
         */
        open() {
            this.createModal();
            this.attachEventListeners();
            setTimeout(() => this.titleInput?.focus(), 100);
        }
        /**
         * Close the Bug modal
         */
        close() {
            if (this.container) {
                this.container.remove();
                this.container = null;
            }
            this.attachmentUI?.destroy();
            this.attachmentUI = null;
            this.options.onClose?.();
        }
        /**
         * Create the modal DOM structure
         */
        createModal() {
            this.container = document.createElement('div');
            this.container.id = 'tf-bug-modal';
            this.container.style.cssText = this.getContainerStyles();
            const modal = document.createElement('div');
            modal.id = 'tf-bug-content';
            modal.style.cssText = this.getModalStyles();
            const closeButton = document.createElement('button');
            closeButton.id = 'tf-bug-close';
            closeButton.textContent = '×';
            closeButton.style.cssText = this.getCloseButtonStyles();
            const header = document.createElement('div');
            header.style.cssText = this.getHeaderStyles();
            header.innerHTML = `
      <h3 style="${this.getTitleStyles()}">🐛 Reportar Bug</h3>
      <p style="${this.getSubtitleStyles()}">Encontrou algo errado? Nos ajude a corrigir!</p>
    `;
            const formContainer = document.createElement('form');
            formContainer.id = 'tf-bug-form';
            formContainer.style.cssText = this.getFormStyles();
            // Severity selector
            const severityGroup = document.createElement('div');
            severityGroup.style.cssText = this.getFieldGroupStyles();
            const severityLabel = document.createElement('label');
            severityLabel.style.cssText = this.getLabelStyles();
            severityLabel.textContent = 'Gravidade do problema';
            const severityContainer = document.createElement('div');
            severityContainer.style.cssText = this.getSeverityContainerStyles();
            const severities = [
                { value: 'low', label: 'Baixa', color: '#00ff88' },
                { value: 'medium', label: 'Média', color: '#ffaa00' },
                { value: 'high', label: 'Alta', color: '#ff6600' },
                { value: 'critical', label: 'Crítica', color: '#ff4444' }
            ];
            severities.forEach(sev => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'tf-bug-severity-btn';
                btn.dataset.severity = sev.value;
                btn.textContent = sev.label;
                btn.style.cssText = this.getSeverityButtonStyles(sev.value === this.selectedSeverity, sev.color);
                severityContainer.appendChild(btn);
            });
            severityGroup.appendChild(severityLabel);
            severityGroup.appendChild(severityContainer);
            // Title field
            const titleGroup = document.createElement('div');
            titleGroup.style.cssText = this.getFieldGroupStyles();
            const titleLabel = document.createElement('label');
            titleLabel.htmlFor = 'tf-bug-title';
            titleLabel.style.cssText = this.getLabelStyles();
            titleLabel.innerHTML = 'Resumo do problema <span style="color: #ff4444;">*</span>';
            this.titleInput = document.createElement('input');
            this.titleInput.id = 'tf-bug-title';
            this.titleInput.type = 'text';
            this.titleInput.placeholder = 'Ex: Botão de login não funciona';
            this.titleInput.required = true;
            this.titleInput.style.cssText = this.getInputStyles();
            titleGroup.appendChild(titleLabel);
            titleGroup.appendChild(this.titleInput);
            // Description field
            const descriptionGroup = document.createElement('div');
            descriptionGroup.style.cssText = this.getFieldGroupStyles();
            const descriptionLabel = document.createElement('label');
            descriptionLabel.htmlFor = 'tf-bug-description';
            descriptionLabel.style.cssText = this.getLabelStyles();
            descriptionLabel.textContent = 'Descrição detalhada (como reproduzir)';
            this.descriptionTextarea = document.createElement('textarea');
            this.descriptionTextarea.id = 'tf-bug-description';
            this.descriptionTextarea.placeholder = 'Descreva os passos para reproduzir o problema...';
            this.descriptionTextarea.style.cssText = this.getTextareaStyles();
            descriptionGroup.appendChild(descriptionLabel);
            descriptionGroup.appendChild(this.descriptionTextarea);
            // Attachment UI container
            const attachmentContainer = document.createElement('div');
            attachmentContainer.id = 'tf-bug-attachments';
            // Submit button
            const submitButton = document.createElement('button');
            submitButton.id = 'tf-bug-submit';
            submitButton.type = 'submit';
            submitButton.textContent = 'Enviar Report';
            submitButton.style.cssText = this.getSubmitButtonStyles();
            formContainer.appendChild(severityGroup);
            formContainer.appendChild(titleGroup);
            formContainer.appendChild(descriptionGroup);
            formContainer.appendChild(attachmentContainer);
            formContainer.appendChild(submitButton);
            modal.appendChild(closeButton);
            modal.appendChild(header);
            modal.appendChild(formContainer);
            this.container.appendChild(modal);
            document.body.appendChild(this.container);
            // Initialize Attachment UI after modal is in DOM
            this.attachmentUI = new AttachmentUI({
                container: attachmentContainer,
                apiUrl: this.options.apiUrl,
                apiKey: this.options.apiKey,
                projectId: this.options.projectId,
                maxAttachments: 5
            });
        }
        /**
         * Attach event listeners
         */
        attachEventListeners() {
            if (!this.container)
                return;
            // Severity buttons
            const severityBtns = this.container.querySelectorAll('.tf-bug-severity-btn');
            severityBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const severity = e.target.dataset.severity;
                    this.selectSeverity(severity);
                });
            });
            // Form submission
            const form = this.container.querySelector('#tf-bug-form');
            form?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submit();
            });
            // Close button
            const closeBtn = this.container.querySelector('#tf-bug-close');
            closeBtn?.addEventListener('click', () => this.close());
            // Close on backdrop click
            this.container.addEventListener('click', (e) => {
                if (e.target === this.container) {
                    this.close();
                }
            });
            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.container) {
                    this.close();
                }
            });
        }
        /**
         * Select severity
         */
        selectSeverity(severity) {
            this.selectedSeverity = severity;
            const buttons = this.container?.querySelectorAll('.tf-bug-severity-btn');
            const severities = {
                low: '#00ff88',
                medium: '#ffaa00',
                high: '#ff6600',
                critical: '#ff4444'
            };
            buttons?.forEach(btn => {
                const btnSeverity = btn.dataset.severity;
                const color = severities[btnSeverity];
                btn.style.cssText = this.getSeverityButtonStyles(btnSeverity === severity, color);
            });
        }
        /**
         * Submit the bug report
         */
        async submit() {
            if (!this.titleInput)
                return;
            const title = this.titleInput.value.trim();
            const description = this.descriptionTextarea?.value?.trim() || '';
            if (!title) {
                this.showError('O resumo do problema é obrigatório');
                this.titleInput?.focus();
                return;
            }
            // Show loading state
            const submitBtn = this.container?.querySelector('#tf-bug-submit');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';
            }
            try {
                // Upload attachments first if any
                let attachmentUrls = [];
                if (this.attachmentUI && this.attachmentUI.getAttachments().length > 0) {
                    const handler = this.attachmentUI.getHandler();
                    const { urls, errors } = await handler.uploadAttachments();
                    if (errors.length > 0) {
                        console.warn('[TinyFeedback] Some attachments failed:', errors);
                    }
                    attachmentUrls = urls;
                }
                const response = await fetch(`${this.options.apiUrl}/api/widget/feedback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.options.apiKey
                    },
                    body: JSON.stringify({
                        project_id: this.options.projectId,
                        type: 'bug',
                        title: title,
                        content: `[${this.selectedSeverity.toUpperCase()}] ${description}`,
                        page_url: window.location.href,
                        user_agent: navigator.userAgent,
                        screenshot_url: attachmentUrls.length > 0 ? attachmentUrls[0] : null,
                        attachment_urls: attachmentUrls
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.warning) {
                        this.showWarning(data.warning.message, data.warning.detail);
                        setTimeout(() => this.close(), 3000);
                        return;
                    }
                    this.showThankYou();
                    this.options.onSubmit?.(title, description, this.selectedSeverity, attachmentUrls);
                }
                else if (response.status === 429) {
                    const errorData = await response.json();
                    if (errorData.error === 'LIMIT_REACHED') {
                        this.showLimitReached(errorData.message);
                    }
                    else {
                        this.showError('Falha ao enviar report. Tente novamente.');
                    }
                }
                else if (response.status === 403) {
                    console.error('[TinyFeedback] Domain not authorized. Check your allowed domains configuration.');
                    this.showError('Domínio não autorizado. Verifique as configurações do projeto.');
                }
                else {
                    console.error('Failed to submit bug report');
                    this.showError('Falha ao enviar report. Tente novamente.');
                }
            }
            catch (error) {
                console.error('Error submitting bug report:', error);
                this.showError('Falha ao enviar report. Tente novamente.');
            }
            finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Enviar Report';
                }
            }
        }
        showWarning(title, detail) {
            if (!this.container)
                return;
            const modal = this.container.querySelector('#tf-bug-content');
            if (modal) {
                modal.innerHTML = `
        <div style="${this.getWarningStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h3 style="${this.getTitleStyles()}">${title}</h3>
          <p style="${this.getSubtitleStyles()}">${detail}</p>
        </div>
      `;
            }
        }
        showLimitReached(message) {
            if (!this.container)
                return;
            const modal = this.container.querySelector('#tf-bug-content');
            if (modal) {
                modal.innerHTML = `
        <div style="${this.getLimitReachedStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">🚫</div>
          <h3 style="${this.getTitleStyles()}">Limite Atingido</h3>
          <p style="${this.getSubtitleStyles()}">${message}</p>
          <button 
            onclick="window.open('/billing', '_blank')"
            style="${this.getUpgradeButtonStyles()}"
          >
            Fazer Upgrade
          </button>
        </div>
      `;
            }
            setTimeout(() => this.close(), 5000);
        }
        showError(message) {
            const existingError = this.container?.querySelector('#tf-bug-error');
            existingError?.remove();
            const errorDiv = document.createElement('div');
            errorDiv.id = 'tf-bug-error';
            errorDiv.style.cssText = this.getErrorStyles();
            errorDiv.textContent = message;
            const form = this.container?.querySelector('#tf-bug-form');
            form?.insertBefore(errorDiv, form.firstChild);
        }
        showThankYou() {
            if (!this.container)
                return;
            const modal = this.container.querySelector('#tf-bug-content');
            if (modal) {
                modal.innerHTML = `
        <div style="${this.getThankYouStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
          <h3 style="${this.getTitleStyles()}">Obrigado!</h3>
          <p style="${this.getSubtitleStyles()}">Seu report foi enviado com sucesso.</p>
        </div>
      `;
            }
            setTimeout(() => this.close(), 2000);
        }
        // ==================== STYLES ====================
        getContainerStyles() {
            return `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
        }
        getModalStyles() {
            return `
      background: #000;
      border: 1px solid #333;
      padding: 32px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 0 40px rgba(255, 68, 68, 0.1);
    `;
        }
        getCloseButtonStyles() {
            return `
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      background: transparent;
      border: none;
      color: #888;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
        }
        getHeaderStyles() {
            return `
      text-align: center;
      margin-bottom: 24px;
    `;
        }
        getTitleStyles() {
            return `
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #fff;
    `;
        }
        getSubtitleStyles() {
            return `
      margin: 0;
      font-size: 14px;
      color: #888;
    `;
        }
        getFormStyles() {
            return `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;
        }
        getFieldGroupStyles() {
            return `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
        }
        getLabelStyles() {
            return `
      font-size: 14px;
      font-weight: 500;
      color: #fff;
    `;
        }
        getSeverityContainerStyles() {
            return `
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    `;
        }
        getSeverityButtonStyles(selected, color) {
            return `
      flex: 1;
      min-width: 60px;
      padding: 8px 12px;
      border: 1px solid ${color};
      background: ${selected ? color : 'transparent'};
      color: ${selected ? '#000' : color};
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      ${selected ? `box-shadow: 0 0 10px ${color}80;` : ''}
    `;
        }
        getInputStyles() {
            return `
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #333;
      background: #111;
      color: #fff;
      font-size: 14px;
      box-sizing: border-box;
      font-family: inherit;
    `;
        }
        getTextareaStyles() {
            return `
      width: 100%;
      min-height: 120px;
      padding: 12px 16px;
      border: 1px solid #333;
      background: #111;
      color: #fff;
      font-size: 14px;
      resize: vertical;
      box-sizing: border-box;
      font-family: inherit;
    `;
        }
        getSubmitButtonStyles() {
            return `
      width: 100%;
      padding: 14px;
      margin-top: 8px;
      background: #ff4444;
      color: #fff;
      border: none;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
        }
        getErrorStyles() {
            return `
      padding: 12px 16px;
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid #ff4444;
      color: #ff4444;
      font-size: 14px;
      margin-bottom: 16px;
    `;
        }
        getThankYouStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
    `;
        }
        getWarningStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ffaa00;
      background: rgba(255, 170, 0, 0.1);
    `;
        }
        getLimitReachedStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ff4444;
      background: rgba(255, 68, 68, 0.1);
    `;
        }
        getUpgradeButtonStyles() {
            return `
      margin-top: 20px;
      padding: 12px 24px;
      background: #ffd700;
      color: #000;
      border: none;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
        }
    }

    /**
     * TinyFeedback Widget
     * Main entry point for the vanilla JS widget
     * ST-12: UX Polish - Animações e Acessibilidade
     *
     * Features:
     * - Smooth animations with reduced motion support
     * - WCAG 2.1 AA compliance
     * - Keyboard navigation
     * - Screen reader support
     */
    class TinyFeedbackWidget {
        constructor(config) {
            this.npsModal = null;
            this.suggestionModal = null;
            this.bugModal = null;
            this.floatingButton = null;
            this.menuContainer = null;
            this.isMenuOpen = false;
            this.isReducedMotion = false;
            this.keydownHandler = null;
            /**
             * Handle outside click to close menu
             */
            this.handleOutsideClick = (e) => {
                if (this.menuContainer && !this.menuContainer.contains(e.target)) {
                    if (this.floatingButton && !this.floatingButton.contains(e.target)) {
                        this.closeMenu();
                    }
                }
            };
            this.config = {
                apiUrl: '',
                position: 'bottom-right',
                primaryColor: '#3b82f6',
                buttonText: 'Feedback',
                ...config
            };
            // Check for reduced motion preference
            this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            // Listen for changes in reduced motion preference
            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                this.isReducedMotion = e.matches;
                this.updateAnimationStyles();
            });
            // If no apiUrl provided, infer from script src
            if (!this.config.apiUrl) {
                this.config.apiUrl = this.inferApiUrl();
            }
        }
        /**
         * Initialize the widget with floating button
         */
        init() {
            this.validateDomain().then((isValid) => {
                if (isValid) {
                    this.fetchAppearance().then((appearance) => {
                        if (appearance) {
                            this.config.primaryColor = appearance.primary_color;
                            this.config.buttonText = appearance.button_text;
                            this.config.position = appearance.position;
                        }
                        this.createFloatingButton();
                    });
                }
                else {
                    console.error('[TinyFeedback] Domain not authorized. Widget will not load.');
                }
            });
        }
        /**
         * Validate domain against API
         */
        async validateDomain() {
            try {
                const origin = window.location.origin;
                const response = await fetch(`${this.config.apiUrl}/api/widget/validate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.config.apiKey
                    },
                    body: JSON.stringify({
                        projectId: this.config.projectId,
                        domain: origin
                    })
                });
                return response.ok;
            }
            catch (error) {
                // If validation fails, still allow (fail open for development)
                console.warn('[TinyFeedback] Domain validation failed:', error);
                return true;
            }
        }
        /**
         * Fetch widget appearance from API
         */
        async fetchAppearance() {
            try {
                const response = await fetch(`${this.config.apiUrl}/api/projects/${this.config.projectId}/widget-appearance`, {
                    headers: {
                        'X-API-Key': this.config.apiKey
                    }
                });
                if (response.ok) {
                    return await response.json();
                }
            }
            catch (error) {
                console.warn('[TinyFeedback] Failed to fetch appearance:', error);
            }
            return null;
        }
        /**
         * Create the floating button
         */
        createFloatingButton() {
            const button = document.createElement('button');
            button.id = 'tinyfeedback-button';
            button.innerHTML = this.config.buttonText;
            button.style.cssText = this.getButtonStyles();
            // A11y: Add accessibility attributes
            button.setAttribute('aria-label', 'Abrir menu de feedback');
            button.setAttribute('aria-haspopup', 'menu');
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('type', 'button');
            button.addEventListener('click', () => this.toggleMenu());
            // Keyboard navigation
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleMenu();
                }
            });
            document.body.appendChild(button);
            this.floatingButton = button;
        }
        /**
         * Get button styles based on position
         */
        getButtonStyles() {
            const baseStyles = `
      position: fixed;
      ${this.getPositionStyles()}
      padding: 12px 20px;
      background: ${this.config.primaryColor};
      color: white;
      border: none;
      border-radius: 9999px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 2147483646;
      transition: transform ${this.isReducedMotion ? '0s' : '0.2s'}, box-shadow ${this.isReducedMotion ? '0s' : '0.2s'};
      outline-offset: 2px;
    `;
            return baseStyles;
        }
        /**
         * Get position-specific styles
         */
        getPositionStyles() {
            const positions = {
                'bottom-right': 'bottom: 20px; right: 20px;',
                'bottom-left': 'bottom: 20px; left: 20px;',
                'top-right': 'top: 20px; right: 20px;',
                'top-left': 'top: 20px; left: 20px;'
            };
            return positions[this.config.position] || positions['bottom-right'];
        }
        /**
         * Toggle the feedback menu
         */
        toggleMenu() {
            if (this.isMenuOpen) {
                this.closeMenu();
            }
            else {
                this.openMenu();
            }
        }
        /**
         * Open the feedback menu
         */
        openMenu() {
            if (!this.floatingButton)
                return;
            // Update ARIA
            this.floatingButton.setAttribute('aria-expanded', 'true');
            const menu = document.createElement('div');
            menu.id = 'tinyfeedback-menu';
            menu.setAttribute('role', 'menu');
            menu.setAttribute('aria-label', 'Opções de feedback');
            menu.style.cssText = this.getMenuStyles();
            menu.innerHTML = `
      <div style="padding: 8px;">
        <button class="tf-menu-item" data-type="nps" role="menuitem" style="${this.getMenuItemStyles()}" tabindex="-1">
          <span style="font-size: 18px; margin-right: 8px;" aria-hidden="true">📊</span>
          <span>Avaliação (NPS)</span>
          <span class="visually-hidden">, Abre modal de avaliação</span>
        </button>
        <button class="tf-menu-item" data-type="suggestion" role="menuitem" style="${this.getMenuItemStyles()}" tabindex="-1">
          <span style="font-size: 18px; margin-right: 8px;" aria-hidden="true">💡</span>
          <span>Sugestão</span>
          <span class="visually-hidden">, Abre modal de sugestão</span>
        </button>
        <button class="tf-menu-item" data-type="bug" role="menuitem" style="${this.getMenuItemStyles()}" tabindex="-1">
          <span style="font-size: 18px; margin-right: 8px;" aria-hidden="true">🐛</span>
          <span>Reportar Bug</span>
          <span class="visually-hidden">, Abre modal de bug</span>
        </button>
      </div>
    `;
            document.body.appendChild(menu);
            this.menuContainer = menu;
            this.isMenuOpen = true;
            // Set up keyboard navigation for menu
            this.setupMenuKeyboardNavigation();
            // Focus first item
            const firstItem = menu.querySelector('[role="menuitem"]');
            if (firstItem) {
                setTimeout(() => firstItem.focus(), this.isReducedMotion ? 0 : 50);
            }
            // Attach click handlers
            menu.querySelectorAll('.tf-menu-item').forEach((item) => {
                item.addEventListener('click', (e) => {
                    const type = e.currentTarget.getAttribute('data-type');
                    this.handleMenuSelection(type);
                });
            });
            // Close on outside click
            setTimeout(() => {
                document.addEventListener('click', this.handleOutsideClick);
            }, 0);
        }
        /**
         * Set up keyboard navigation for the menu
         */
        setupMenuKeyboardNavigation() {
            if (!this.menuContainer)
                return;
            const items = this.menuContainer.querySelectorAll('[role="menuitem"]');
            this.keydownHandler = (e) => {
                const currentFocus = document.activeElement;
                const currentIndex = Array.from(items).indexOf(currentFocus);
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                        items[nextIndex].focus();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                        items[prevIndex].focus();
                        break;
                    case 'Home':
                        e.preventDefault();
                        items[0].focus();
                        break;
                    case 'End':
                        e.preventDefault();
                        items[items.length - 1].focus();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        this.closeMenu();
                        this.floatingButton?.focus();
                        break;
                    case 'Tab':
                        // Close menu on tab out
                        e.preventDefault();
                        this.closeMenu();
                        break;
                }
            };
            this.menuContainer.addEventListener('keydown', this.keydownHandler);
        }
        /**
         * Close the feedback menu
         */
        closeMenu() {
            if (this.menuContainer) {
                // Remove keyboard handler
                if (this.keydownHandler) {
                    this.menuContainer.removeEventListener('keydown', this.keydownHandler);
                }
                // Animate out
                if (!this.isReducedMotion) {
                    this.menuContainer.style.opacity = '0';
                    this.menuContainer.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        this.menuContainer?.remove();
                        this.menuContainer = null;
                    }, 200);
                }
                else {
                    this.menuContainer.remove();
                    this.menuContainer = null;
                }
            }
            // Update ARIA
            this.floatingButton?.setAttribute('aria-expanded', 'false');
            this.isMenuOpen = false;
            document.removeEventListener('click', this.handleOutsideClick);
        }
        /**
         * Handle menu selection
         */
        handleMenuSelection(type) {
            this.closeMenu();
            switch (type) {
                case 'nps':
                    this.openNPS();
                    break;
                case 'suggestion':
                    this.openSuggestion();
                    break;
                case 'bug':
                    this.openBug();
                    break;
            }
        }
        /**
         * Get menu styles
         */
        getMenuStyles() {
            const positionStyles = this.getMenuPositionStyles();
            const animationStyles = this.isReducedMotion
                ? ''
                : 'animation: tf-menu-appear 0.2s ease-out;';
            return `
      position: fixed;
      ${positionStyles}
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 2147483647;
      min-width: 200px;
      ${animationStyles}
      transition: opacity 0.2s, transform 0.2s;
      transform-origin: bottom right;
    `;
        }
        /**
         * Get menu position styles
         */
        getMenuPositionStyles() {
            const positions = {
                'bottom-right': 'bottom: 80px; right: 20px;',
                'bottom-left': 'bottom: 80px; left: 20px;',
                'top-right': 'top: 80px; right: 20px;',
                'top-left': 'top: 80px; left: 20px;'
            };
            return positions[this.config.position] || positions['bottom-right'];
        }
        /**
         * Get menu item styles
         */
        getMenuItemStyles() {
            return `
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px 16px;
      background: none;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      font-size: 14px;
      color: #374151;
      transition: background ${this.isReducedMotion ? '0s' : '0.15s'};
      text-align: left;
      outline-offset: 2px;
    `;
        }
        /**
         * Update animation styles based on reduced motion preference
         */
        updateAnimationStyles() {
            if (this.floatingButton) {
                this.floatingButton.style.cssText = this.getButtonStyles();
            }
        }
        /**
         * Open the NPS feedback modal
         */
        openNPS() {
            if (this.npsModal) {
                this.npsModal.close();
            }
            this.npsModal = new NPSModal({
                projectId: this.config.projectId,
                apiKey: this.config.apiKey,
                apiUrl: this.config.apiUrl,
                reducedMotion: this.isReducedMotion,
                onClose: () => {
                    this.npsModal = null;
                    // Return focus to button
                    this.floatingButton?.focus();
                }
            });
            this.npsModal.open();
        }
        /**
         * Open the Suggestion modal
         */
        openSuggestion() {
            if (this.suggestionModal) {
                this.suggestionModal.close();
            }
            this.suggestionModal = new SuggestionModal({
                projectId: this.config.projectId,
                apiKey: this.config.apiKey,
                apiUrl: this.config.apiUrl,
                reducedMotion: this.isReducedMotion,
                onClose: () => {
                    this.suggestionModal = null;
                    this.floatingButton?.focus();
                }
            });
            this.suggestionModal.open();
        }
        /**
         * Open the Bug Report modal
         */
        openBug() {
            if (this.bugModal) {
                this.bugModal.close();
            }
            this.bugModal = new BugModal({
                projectId: this.config.projectId,
                apiKey: this.config.apiKey,
                apiUrl: this.config.apiUrl,
                reducedMotion: this.isReducedMotion,
                onClose: () => {
                    this.bugModal = null;
                    this.floatingButton?.focus();
                }
            });
            this.bugModal.open();
        }
        /**
         * Close any open modals
         */
        close() {
            this.npsModal?.close();
            this.npsModal = null;
            this.suggestionModal?.close();
            this.suggestionModal = null;
            this.bugModal?.close();
            this.bugModal = null;
            this.closeMenu();
        }
        /**
         * Infer API URL from the script src
         */
        inferApiUrl() {
            const scripts = document.querySelectorAll('script');
            for (let i = 0; i < scripts.length; i++) {
                const src = scripts[i].src;
                if (src.includes('tinyfeedback')) {
                    const url = new URL(src);
                    return `${url.protocol}//${url.host}`;
                }
            }
            return '';
        }
    }
    // Auto-initialize if config is present in window
    if (typeof window !== 'undefined') {
        window.TinyFeedback = TinyFeedbackWidget;
        window.TinyFeedbackWidget = TinyFeedbackWidget;
        // Check for auto-initialize config
        const tfConfig = window.__TF_CONFIG__;
        if (tfConfig?.projectId && tfConfig?.apiKey) {
            const widget = new TinyFeedbackWidget(tfConfig);
            widget.init();
            // Store instance globally
            window.__TF_WIDGET__ = widget;
            // Auto-open NPS if triggered
            if (window.__TF_OPEN_NPS__) {
                widget.openNPS();
            }
            // Auto-open Suggestion if triggered
            if (window.__TF_OPEN_SUGGESTION__) {
                widget.openSuggestion();
            }
        }
    }
    // Add CSS animations and a11y utilities
    const style = document.createElement('style');
    style.textContent = `
  @keyframes tf-menu-appear {
    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  
  .tf-menu-item:hover { 
    background: #f3f4f6 !important; 
  }
  
  .tf-menu-item:focus-visible {
    background: #f3f4f6 !important;
    outline: 2px solid ${document.querySelector('#tinyfeedback-button')?.getAttribute('style')?.includes('background:')
    ? document.querySelector('#tinyfeedback-button')?.getAttribute('style')?.match(/background:\s*([^;]+)/)?.[1] || '#3b82f6'
    : '#3b82f6'};
    outline-offset: -2px;
  }
  
  /* Visually hidden class for screen reader text */
  .visually-hidden {
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
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .tf-menu-item {
      border: 2px solid currentColor !important;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  /* Focus visible styles */
  #tinyfeedback-button:focus-visible {
    outline: 3px solid #fff;
    outline-offset: 3px;
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.5);
  }
`;
    document.head?.appendChild(style);

    exports.BugModal = BugModal;
    exports.NPSModal = NPSModal;
    exports.SuggestionModal = SuggestionModal;
    exports.TinyFeedbackWidget = TinyFeedbackWidget;

    return exports;

})({});

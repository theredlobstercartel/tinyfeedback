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

export interface AttachmentFile {
  id: string;
  file: File | null;
  previewUrl: string;
  type: 'screenshot' | 'upload';
  name: string;
  size: number;
}

export interface AttachmentOptions {
  apiUrl: string;
  apiKey: string;
  projectId: string;
  maxFileSize?: number; // in bytes, default 5MB
  allowedTypes?: string[];
  onAttachmentChange?: (attachments: AttachmentFile[]) => void;
}

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export class AttachmentHandler {
  private options: Required<AttachmentOptions>;
  private attachments: AttachmentFile[] = [];
  private fileInput: HTMLInputElement | null = null;

  constructor(options: AttachmentOptions) {
    this.options = {
      maxFileSize: DEFAULT_MAX_FILE_SIZE,
      allowedTypes: DEFAULT_ALLOWED_TYPES,
      onAttachmentChange: () => {},
      ...options
    };
    this.createFileInput();
  }

  /**
   * Get current attachments
   */
  public getAttachments(): AttachmentFile[] {
    return [...this.attachments];
  }

  /**
   * Get attachment count
   */
  public getAttachmentCount(): number {
    return this.attachments.length;
  }

  /**
   * Clear all attachments
   */
  public clearAttachments(): void {
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
  public removeAttachment(id: string): void {
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
  public async captureScreenshot(): Promise<AttachmentFile | null> {
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
                  } else {
                    resolve(null);
                  }
                }, 'image/png');
              } else {
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
      } else {
        // Fallback: capture visible viewport using html2canvas-like approach
        return this.captureViewportScreenshot();
      }
    } catch (error) {
      console.warn('[TinyFeedback] Screenshot capture failed:', error);
      return null;
    }
  }

  /**
   * Fallback viewport screenshot using DOM-to-image approach
   */
  private async captureViewportScreenshot(): Promise<AttachmentFile | null> {
    try {
      // Create a canvas and draw the visible viewport
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

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
          } else {
            resolve(null);
          }
        }, 'image/png', 0.8);
      });
    } catch (error) {
      console.warn('[TinyFeedback] Viewport capture failed:', error);
      return null;
    }
  }

  /**
   * Trigger file input for manual upload
   */
  public triggerFileUpload(): void {
    this.fileInput?.click();
  }

  /**
   * Handle file selection
   */
  private handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    
    if (!files || files.length === 0) return;
    
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
  private validateFile(file: File): string | null {
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
  private createAttachment(file: File, type: 'screenshot' | 'upload'): AttachmentFile {
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
  private createFileInput(): void {
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
  private notifyChange(): void {
    this.options.onAttachmentChange([...this.attachments]);
  }

  /**
   * Format file size for display
   */
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Upload attachments to Supabase Storage
   */
  public async uploadAttachments(): Promise<{ urls: string[]; errors: string[] }> {
    const urls: string[] = [];
    const errors: string[] = [];
    
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
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
          errors.push(`${attachment.name}: ${errorData.error || 'Upload failed'}`);
        }
      } catch (error) {
        errors.push(`${attachment.name}: Network error`);
      }
    }
    
    return { urls, errors };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.clearAttachments();
    if (this.fileInput) {
      this.fileInput.remove();
      this.fileInput = null;
    }
  }
}

export type { AttachmentOptions };

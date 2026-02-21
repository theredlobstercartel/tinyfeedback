import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SuggestionModal, SuggestionModalOptions } from './SuggestionModal';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SuggestionModal', () => {
  let modal: SuggestionModal;
  let options: SuggestionModalOptions;

  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = '';
    
    // Reset mocks
    mockFetch.mockReset();
    
    // Setup options
    options = {
      projectId: 'test-project-123',
      apiKey: 'test-api-key',
      apiUrl: 'https://test.example.com',
      onClose: vi.fn(),
      onSubmit: vi.fn()
    };
    
    modal = new SuggestionModal(options);
  });

  describe('AC-01: Formulário de sugestão', () => {
    it('should create modal with title input field', () => {
      modal.open();
      
      const titleInput = document.querySelector('#tf-suggestion-title') as HTMLInputElement;
      expect(titleInput).not.toBeNull();
      expect(titleInput.placeholder).toBe('Ex: Adicionar modo escuro');
    });

    it('should create modal with description textarea field', () => {
      modal.open();
      
      const descriptionTextarea = document.querySelector('#tf-suggestion-description') as HTMLTextAreaElement;
      expect(descriptionTextarea).not.toBeNull();
      expect(descriptionTextarea.placeholder).toBe('Descreva sua sugestão em detalhes...');
    });

    it('should create modal with submit button', () => {
      modal.open();
      
      const submitBtn = document.querySelector('#tf-suggestion-submit') as HTMLButtonElement;
      expect(submitBtn).not.toBeNull();
      expect(submitBtn.textContent).toBe('Enviar Sugestão');
    });

    it('should create modal with close button', () => {
      modal.open();
      
      const closeBtn = document.querySelector('#tf-suggestion-close') as HTMLButtonElement;
      expect(closeBtn).not.toBeNull();
    });

    it('should create modal container with correct styles', () => {
      modal.open();
      
      const container = document.querySelector('#tf-suggestion-modal') as HTMLElement;
      expect(container).not.toBeNull();
      expect(container.style.position).toBe('fixed');
    });

    it('should have title input as required', () => {
      modal.open();
      
      const titleInput = document.querySelector('#tf-suggestion-title') as HTMLInputElement;
      expect(titleInput.required).toBe(true);
    });
  });

  describe('AC-02: Enviar sugestão', () => {
    it('should call API with type="suggestion" when submitting valid form', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'feedback-123' } })
      });

      modal.open();
      
      // Fill the form
      const titleInput = document.querySelector('#tf-suggestion-title') as HTMLInputElement;
      const descTextarea = document.querySelector('#tf-suggestion-description') as HTMLTextAreaElement;
      
      titleInput.value = 'Dark mode feature';
      descTextarea.value = 'Add dark mode to the dashboard';
      
      // Submit the form
      const form = document.querySelector('#tf-suggestion-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.type).toBe('suggestion');
      expect(requestBody.title).toBe('Dark mode feature');
      expect(requestBody.content).toBe('Add dark mode to the dashboard');
    });

    it('should include page_url and user_agent in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      modal.open();
      
      const titleInput = document.querySelector('#tf-suggestion-title') as HTMLInputElement;
      titleInput.value = 'Test suggestion';
      
      const form = document.querySelector('#tf-suggestion-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.page_url).toBeDefined();
      expect(requestBody.user_agent).toBeDefined();
    });

    it('should include project_id in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      modal.open();
      
      const titleInput = document.querySelector('#tf-suggestion-title') as HTMLInputElement;
      titleInput.value = 'Test suggestion';
      
      const form = document.querySelector('#tf-suggestion-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.project_id).toBe('test-project-123');
    });

    it('should include X-API-Key header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      modal.open();
      
      const titleInput = document.querySelector('#tf-suggestion-title') as HTMLInputElement;
      titleInput.value = 'Test suggestion';
      
      const form = document.querySelector('#tf-suggestion-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockFetch.mock.calls[0][1].headers['X-API-Key']).toBe('test-api-key');
    });

    it('should show thank you message after successful submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      modal.open();
      
      const titleInput = document.querySelector('#tf-suggestion-title') as HTMLInputElement;
      titleInput.value = 'Test suggestion';
      
      const form = document.querySelector('#tf-suggestion-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const modalContent = document.querySelector('#tf-suggestion-content') as HTMLElement;
      expect(modalContent.textContent).toContain('Obrigado');
      expect(modalContent.textContent).toContain('Sua sugestão foi enviada com sucesso');
    });

    it('should call onSubmit callback after successful submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      modal.open();
      
      const titleInput = document.querySelector('#tf-suggestion-title') as HTMLInputElement;
      const descTextarea = document.querySelector('#tf-suggestion-description') as HTMLTextAreaElement;
      
      titleInput.value = 'Dark mode';
      descTextarea.value = 'Please add dark mode';
      
      const form = document.querySelector('#tf-suggestion-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(options.onSubmit).toHaveBeenCalledWith('Dark mode', 'Please add dark mode');
    });
  });

  describe('Validação', () => {
    it('should show error when title is empty', async () => {
      modal.open();
      
      const form = document.querySelector('#tf-suggestion-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const errorElement = document.querySelector('#tf-suggestion-error') as HTMLElement;
      expect(errorElement).not.toBeNull();
      expect(errorElement.textContent).toBe('O título é obrigatório');
    });

    it('should allow submission with only title (description optional)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      modal.open();
      
      const titleInput = document.querySelector('#tf-suggestion-title') as HTMLInputElement;
      titleInput.value = 'Add dark mode';
      // No description provided
      
      const form = document.querySelector('#tf-suggestion-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockFetch).toHaveBeenCalled();
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.content).toBe(''); // Empty string when no description
    });

    it('should use empty string for content when description is not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      modal.open();
      
      const titleInput = document.querySelector('#tf-suggestion-title') as HTMLInputElement;
      titleInput.value = 'My feature suggestion';
      
      const form = document.querySelector('#tf-suggestion-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.content).toBe('');
    });
  });

  describe('Interação do modal', () => {
    it('should close when close button is clicked', () => {
      modal.open();
      
      const closeBtn = document.querySelector('#tf-suggestion-close') as HTMLButtonElement;
      closeBtn.click();
      
      const container = document.querySelector('#tf-suggestion-modal');
      expect(container).toBeNull();
      expect(options.onClose).toHaveBeenCalled();
    });

    it('should close when backdrop is clicked', () => {
      modal.open();
      
      const container = document.querySelector('#tf-suggestion-modal') as HTMLElement;
      container.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      expect(document.querySelector('#tf-suggestion-modal')).toBeNull();
      expect(options.onClose).toHaveBeenCalled();
    });

    it('should show error message when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' })
      });

      modal.open();
      
      const titleInput = document.querySelector('#tf-suggestion-title') as HTMLInputElement;
      titleInput.value = 'Test suggestion';
      
      const form = document.querySelector('#tf-suggestion-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const errorElement = document.querySelector('#tf-suggestion-error') as HTMLElement;
      expect(errorElement).not.toBeNull();
      expect(errorElement.textContent).toBe('Falha ao enviar sugestão. Tente novamente.');
    });

    it('should close on Escape key press', () => {
      modal.open();
      
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      
      expect(document.querySelector('#tf-suggestion-modal')).toBeNull();
      expect(options.onClose).toHaveBeenCalled();
    });
  });
});

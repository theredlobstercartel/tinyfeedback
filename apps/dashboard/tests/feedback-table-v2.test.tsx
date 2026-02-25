import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FeedbackTableV2 } from '@/components/feedback-table-v2'
import { FeedbackItem } from '@/types/dashboard-feedback'

// Mock data
const mockFeedbacks: FeedbackItem[] = [
  {
    id: '1',
    project_id: 'demo-project',
    type: 'nps',
    content: { score: 9, comment: 'Ótimo produto!' },
    user_email: 'joao@example.com',
    user_name: 'João Silva',
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    technical_context: {
      url: 'https://example.com/dashboard',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      viewport: { width: 1920, height: 1080 },
    },
  },
  {
    id: '2',
    project_id: 'demo-project',
    type: 'bug',
    content: { 
      description: 'Página trava ao exportar relatório',
      category: 'Bug'
    },
    user_email: 'maria@example.com',
    user_name: 'Maria Santos',
    status: 'analyzing',
    priority: 'high',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '3',
    project_id: 'demo-project',
    type: 'suggestion',
    content: { 
      title: 'Adicionar modo escuro',
      description: 'Seria ótimo ter modo escuro',
      category: 'Feature'
    },
    anonymous_id: 'anon_12345',
    status: 'new',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
]

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
)

describe('FeedbackTableV2', () => {
  const defaultProps = {
    feedbacks: mockFeedbacks,
    isLoading: false,
    totalItems: 3,
    page: 1,
    pageSize: 20,
    sorting: [{ id: 'created_at', desc: true }],
    columnFilters: [],
    rowSelection: {},
    onSortingChange: vi.fn(),
    onColumnFiltersChange: vi.fn(),
    onRowSelectionChange: vi.fn(),
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    onView: vi.fn(),
    onStatusChange: vi.fn(),
    onMarkAsRead: vi.fn(),
    onArchive: vi.fn(),
    onDelete: vi.fn(),
  }

  it('renders table with feedback data', () => {
    render(<Wrapper><FeedbackTableV2 {...defaultProps} /></Wrapper>)
    
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    expect(screen.getByText('Anônimo')).toBeInTheDocument()
  })

  it('renders correct status badges', () => {
    render(<Wrapper><FeedbackTableV2 {...defaultProps} /></Wrapper>)
    
    expect(screen.getByText('Novo')).toBeInTheDocument()
    expect(screen.getByText('Em análise')).toBeInTheDocument()
  })

  it('renders type icons correctly', () => {
    render(<Wrapper><FeedbackTableV2 {...defaultProps} /></Wrapper>)
    
    expect(screen.getByText('NPS')).toBeInTheDocument()
    expect(screen.getByText('Bug')).toBeInTheDocument()
    expect(screen.getByText('Sugestão')).toBeInTheDocument()
  })

  it('handles row selection', async () => {
    const onRowSelectionChange = vi.fn()
    render(
      <Wrapper>
        <FeedbackTableV2 {...defaultProps} onRowSelectionChange={onRowSelectionChange} />
      </Wrapper>
    )
    
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // First data row checkbox
    
    await waitFor(() => {
      expect(onRowSelectionChange).toHaveBeenCalled()
    })
  })

  it('displays loading state', () => {
    render(<Wrapper><FeedbackTableV2 {...defaultProps} isLoading={true} /></Wrapper>)
    
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('displays empty state when no feedbacks', () => {
    render(<Wrapper><FeedbackTableV2 {...defaultProps} feedbacks={[]} /></Wrapper>)
    
    expect(screen.getByText('Nenhum feedback encontrado')).toBeInTheDocument()
  })

  it('calls onView when view action is triggered', async () => {
    const onView = vi.fn()
    render(<Wrapper><FeedbackTableV2 {...defaultProps} onView={onView} /></Wrapper>)
    
    // Find and click the menu button
    const menuButtons = screen.getAllByRole('button', { name: '' })
    fireEvent.click(menuButtons[0])
    
    // Click view option
    await waitFor(() => {
      const viewOption = screen.getByText('Ver detalhes')
      fireEvent.click(viewOption)
    })
    
    expect(onView).toHaveBeenCalledWith(mockFeedbacks[0])
  })
})

describe('Performance Requirements', () => {
  it('should render 20 items efficiently', () => {
    const largeDataset = Array.from({ length: 20 }, (_, i) => ({
      ...mockFeedbacks[0],
      id: `item-${i}`,
      user_name: `User ${i}`,
    }))
    
    const startTime = performance.now()
    
    render(
      <Wrapper>
        <FeedbackTableV2
          {...defaultProps}
          feedbacks={largeDataset}
          totalItems={20}
        />
      </Wrapper>
    )
    
    const renderTime = performance.now() - startTime
    
    // Should render in less than 500ms
    expect(renderTime).toBeLessThan(500)
    expect(screen.getByText('User 0')).toBeInTheDocument()
    expect(screen.getByText('User 19')).toBeInTheDocument()
  })
})

describe('Accessibility', () => {
  it('should have proper table structure', () => {
    render(<Wrapper><FeedbackTableV2 {...defaultProps} /></Wrapper>)
    
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('should have accessible checkboxes', () => {
    render(<Wrapper><FeedbackTableV2 {...defaultProps} /></Wrapper>)
    
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
  })
})

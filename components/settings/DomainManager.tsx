'use client';

import { useState, useCallback } from 'react';
import { Globe, Plus, Trash2, Shield, AlertCircle } from 'lucide-react';
import { validateDomain, normalizeDomain } from '@/lib/utils/domain';

interface DomainManagerProps {
  projectId: string;
  initialDomains?: string[];
}

export function DomainManager({ projectId, initialDomains = [] }: DomainManagerProps) {
  const [domains, setDomains] = useState<string[]>(initialDomains);
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddDomain = useCallback(async () => {
    setError(null);
    
    const normalized = normalizeDomain(newDomain);
    const validation = validateDomain(normalized, domains);
    
    if (!validation.valid) {
      setError(validation.error || 'Domínio inválido');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/domains`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          domain: normalized,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adicionar domínio');
      }

      setDomains(data.data.allowed_domains);
      setNewDomain('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar domínio');
    } finally {
      setIsLoading(false);
    }
  }, [newDomain, domains, projectId]);

  const handleRemoveDomain = useCallback(async (domainToRemove: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/domains`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove',
          domain: domainToRemove,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover domínio');
      }

      setDomains(data.data.allowed_domains);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover domínio');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDomain();
    }
  }, [handleAddDomain]);

  return (
    <div 
      className="p-6 space-y-6"
      style={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #222222',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: '#222222' }}>
        <Shield size={20} style={{ color: '#00ff88' }} />
        <div>
          <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 600 }}>
            Domínios Permitidos
          </h2>
          <p style={{ color: '#888888', fontSize: '0.875rem' }}>
            Apenas estes domínios podem usar seu widget
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="flex items-center gap-2 p-3 text-sm"
          style={{
            backgroundColor: '#ff444420',
            border: '1px solid #ff4444',
            color: '#ff4444',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Add Domain Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Globe 
            size={16} 
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#888888' }} 
          />
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="exemplo.com"
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-2 text-sm focus:outline-none transition-colors disabled:opacity-50"
            style={{
              backgroundColor: '#000000',
              border: '1px solid #222222',
              color: '#ffffff',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#00ff88';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#222222';
            }}
          />
        </div>
        <button
          onClick={handleAddDomain}
          disabled={isLoading || !newDomain.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isLoading ? '#00ff8840' : '#00ff88',
            color: '#000000',
          }}
          onMouseEnter={(e) => {
            if (!isLoading && newDomain.trim()) {
              e.currentTarget.style.backgroundColor = '#00ffaa';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#00ff88';
            }
          }}
        >
          <Plus size={16} />
          Adicionar
        </button>
      </div>

      {/* Domains List */}
      <div className="space-y-2">
        {domains.length === 0 ? (
          <div 
            className="p-8 text-center text-sm"
            style={{ color: '#888888' }}
          >
            <Globe size={32} className="mx-auto mb-3" style={{ color: '#333333' }} />
            <p>Nenhum domínio configurado</p>
            <p className="mt-1" style={{ fontSize: '0.75rem' }}>
              Adicione domínios para restringir onde o widget pode ser usado
            </p>
          </div>
        ) : (
          domains.map((domain) => (
            <div
              key={domain}
              className="flex items-center justify-between p-3 group"
              style={{
                backgroundColor: '#000000',
                border: '1px solid #222222',
              }}
            >
              <div className="flex items-center gap-3">
                <Globe size={16} style={{ color: '#00ff88' }} />
                <span style={{ color: '#ffffff', fontSize: '0.875rem' }}>
                  {domain}
                </span>
              </div>
              <button
                onClick={() => handleRemoveDomain(domain)}
                disabled={isLoading}
                className="p-2 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                style={{ color: '#ff4444' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff444420';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label={`Remover ${domain}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div 
        className="p-3 text-xs space-y-1"
        style={{
          backgroundColor: '#000000',
          border: '1px solid #222222',
          color: '#888888',
        }}
      >
        <p style={{ color: '#00ff88' }}>Dicas:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Não inclua http:// ou https://</li>
          <li>Não inclua caminhos (/caminho)</li>
          <li>Subdomínios devem ser adicionados separadamente</li>
          <li>Lista vazia permite todos os domínios</li>
        </ul>
      </div>
    </div>
  );
}

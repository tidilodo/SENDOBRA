'use client';

import {useEffect, useState} from 'react';
import {RefreshCw} from 'lucide-react';

type Connection = 'checking' | 'connected' | 'disconnected' | 'unavailable';

const labels: Record<Connection, string> = {
  checking: 'Verificando conexão do WhatsApp',
  connected: 'WhatsApp conectado',
  disconnected: 'WhatsApp desconectado',
  unavailable: 'Não foi possível verificar a conexão do WhatsApp',
};

export default function WhatsAppConnection() {
  const [connection, setConnection] = useState<Connection>('checking');

  async function checkConnection(signal?: AbortSignal) {
    setConnection('checking');
    try {
      const response = await fetch('/api/whatsapp-config', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'status'}),
        signal,
      });
      if (!response.ok) throw new Error('Falha na consulta');
      const {connected} = await response.json();
      if (typeof connected !== 'boolean') throw new Error('Status indisponível');
      setConnection(connected ? 'connected' : 'disconnected');
    } catch {
      if (!signal?.aborted) setConnection('unavailable');
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void checkConnection(controller.signal);
    return () => controller.abort();
  }, []);

  const label = labels[connection];
  return (
    <div className="wa-sidebar-status">
      <span className="wa-status-dot" data-state={connection} role="status" aria-label={label} title={label}/>
      <button
        type="button"
        aria-label="Verificar conexão do WhatsApp"
        title="Verificar conexão do WhatsApp"
        disabled={connection === 'checking'}
        onClick={() => void checkConnection()}
      >
        <RefreshCw size={15} aria-hidden="true"/>
      </button>
    </div>
  );
}

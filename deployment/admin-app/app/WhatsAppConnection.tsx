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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.521.149-.174.198-.298.298-.497.099-.198.049-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.273.298-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.174-1.413-.074-.124-.272-.198-.57-.347zM12.036 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.86 9.86 0 0 1 2.15 11.9c.002-5.45 4.437-9.884 9.89-9.884a9.82 9.82 0 0 1 6.99 2.899 9.825 9.825 0 0 1 2.893 6.993c-.003 5.45-4.437 9.877-9.887 9.877zm8.413-18.29A11.82 11.82 0 0 0 12.04 0C5.483 0 .147 5.336.144 11.897c0 2.097.548 4.145 1.588 5.951L.045 24l6.296-1.652a11.88 11.88 0 0 0 5.686 1.448h.005c6.554 0 11.89-5.336 11.893-11.897a11.82 11.82 0 0 0-3.476-8.404z"/>
      </svg>
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

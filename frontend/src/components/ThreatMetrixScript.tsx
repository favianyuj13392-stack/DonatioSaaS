import React, { useEffect, useState } from 'react';

interface ThreatMetrixScriptProps {
  merchantId?: string;
  orgId?: string;
  onSessionGenerated?: (sessionId: string) => void;
}

export const ThreatMetrixScript: React.FC<ThreatMetrixScriptProps> = ({
  merchantId = 'redenlace_000021',
  orgId = '1snn5n9w', // Sandbox orgId (k8vif92e para Producción)
  onSessionGenerated,
}) => {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Generar GUID único para el perfil de riesgo ThreatMetrix
    const randomGuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

    const fullSessionId = `${merchantId}_${randomGuid}`;
    setSessionId(fullSessionId);

    if (onSessionGenerated) {
      onSessionGenerated(fullSessionId);
    }

    // Inyección idempotente del script de ThreatMetrix
    const scriptId = 'threatmetrix_tags_js';
    if (!document.getElementById(scriptId)) {
      try {
        const scriptUrl = `https://h.online-metrix.net/fp/tags.js?org_id=${orgId}&session_id=${fullSessionId}`;
        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'text/javascript';
        script.src = scriptUrl;
        script.async = true;
        document.head.appendChild(script);
      } catch (e) {
        console.warn('[ThreatMetrix] Warning injecting script:', e);
      }
    }
  }, [merchantId, orgId]);

  if (!sessionId) return null;

  return (
    <noscript>
      <iframe
        title="ThreatMetrix NoScript"
        style={{ width: '100px', height: '100px', border: 0, position: 'absolute', top: '-5000px' }}
        src={`https://h.online-metrix.net/fp/tags?org_id=${orgId}&session_id=${sessionId}`}
      />
    </noscript>
  );
};

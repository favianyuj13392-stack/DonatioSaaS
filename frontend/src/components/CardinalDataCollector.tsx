import React, { useEffect, useRef } from 'react';

interface CardinalDataCollectorProps {
  jwt: string;
  collectionUrl?: string;
  onComplete?: () => void;
}

export const CardinalDataCollector: React.FC<CardinalDataCollectorProps> = ({
  jwt,
  collectionUrl = 'https://centinelapistag.cardinalcommerce.com/V1/Cruise/Collect',
  onComplete,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const hasFiredRef = useRef<boolean>(false);

  useEffect(() => {
    hasFiredRef.current = false;

    // Escuchar el evento postMessage de finalización desde el iframe de Cardinal Cruise
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin === 'https://centinelapistag.cardinalcommerce.com' ||
        event.origin.includes('cardinalcommerce.com')
      ) {
        console.log('[Cardinal Cruise] Recolección de datos 3DS2 completada:', event.data);
        if (onComplete && !hasFiredRef.current) {
          hasFiredRef.current = true;
          onComplete();
        }
      }
    };

    window.addEventListener('message', handleMessage, false);

    // Enviar el formulario oculto automáticamente al iframe al montar
    if (formRef.current && jwt) {
      formRef.current.submit();
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [jwt, onComplete]);

  if (!jwt) return null;

  return (
    <div style={{ display: 'none' }}>
      <iframe
        id="cardinal_collection_iframe"
        name="collectionIframe"
        title="Cardinal Collection Iframe"
        height="10"
        width="10"
        style={{ display: 'none' }}
      />
      <form
        ref={formRef}
        id="cardinal_collection_form"
        method="POST"
        target="collectionIframe"
        action={collectionUrl}
      >
        <input type="hidden" name="JWT" value={jwt} />
      </form>
    </div>
  );
};

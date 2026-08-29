import React, { useEffect, useState } from 'react';
import { QrResponse } from '../types';
import { checkQrStatus } from '../services/api';
import { QrCode, Clock, X, Copy, Download } from 'lucide-react';

interface QrDisplayModalProps {
  qrData: QrResponse;
  onSuccess: (receiptUrl?: string) => void;
  onClose: () => void;
}

export const QrDisplayModal: React.FC<QrDisplayModalProps> = ({
  qrData,
  onSuccess,
  onClose,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600); // 10 minutos
  const [isChecking, setIsChecking] = useState<boolean>(true);

  // Cuenta regresiva del temporizador
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Polling de verificación de estado cada 3 segundos
  useEffect(() => {
    if (!isChecking || secondsRemaining <= 0) return;

    const interval = setInterval(async () => {
      try {
        const result = await checkQrStatus(qrData.donation_id);
        if (result.status === 'completed') {
          setIsChecking(false);
          clearInterval(interval);
          onSuccess(result.receipt_url);
        }
      } catch (err) {
        console.error('Error en polling de QR:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [qrData.donation_id, isChecking, secondsRemaining, onSuccess]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  const handleCopyCode = () => {
    // @ts-ignore - in case qr_raw_code is typed differently
    if (qrData.qr.qr_raw_code) {
      // @ts-ignore
      navigator.clipboard.writeText(qrData.qr.qr_raw_code);
    }
  };

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = qrData.qr.qr_image_url;
    link.download = 'qr-donacion.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 relative text-center">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 rounded-2xl bg-tenant-light text-tenant-primary mb-3">
          <QrCode className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-black text-gray-900 mb-1">
          Escanea para Donar
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Abre la app de tu banco favorito en Bolivia y escanea el código QR Simple.
        </p>

        {/* Imagen del Código QR */}
        <div className="relative bg-gray-50 p-4 rounded-2xl border border-gray-200 inline-block mb-4 shadow-inner">
          <img
            src={qrData.qr.qr_image_url}
            alt="Código QR de Donación"
            className="w-48 h-48 mx-auto object-contain"
          />
          {secondsRemaining <= 0 && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-2xl">
              <span className="font-bold text-gray-900 mb-2">QR Expirado</span>
              <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg">Generar nuevo</button>
            </div>
          )}
        </div>

        {/* Acciones del QR */}
        <div className="flex justify-center gap-2 mb-4">
          <button onClick={handleCopyCode} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition">
            <Copy className="w-3.5 h-3.5" /> Copiar código
          </button>
          <button onClick={handleDownloadQr} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition">
            <Download className="w-3.5 h-3.5" /> Descargar imagen QR
          </button>
        </div>

        {/* Referencia y Temporizador */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-center gap-1.5 font-mono text-gray-600 bg-gray-100 py-1.5 px-3 rounded-lg">
            <span>Ref: {qrData.qr.merchant_reference_number}</span>
          </div>

          <div className="flex items-center justify-center gap-1.5 font-semibold text-amber-700 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-200/60">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Expira en: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-gray-400 text-[11px] pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Esperando confirmación bancaria en vivo...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

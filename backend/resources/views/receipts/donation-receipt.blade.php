<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recibo Oficial de Donación #REC-{{ $donation->paid_at ? $donation->paid_at->format('Ym') : now()->format('Ym') }}-{{ str_pad($donation->id, 5, '0', STR_PAD_LEFT) }}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        body {
            background-color: #f1f5f9;
            color: #0f172a;
            padding: 40px 20px;
        }
        .receipt-container {
            max-width: 750px;
            margin: 0 auto;
            background: #ffffff;
            padding: 48px;
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
            position: relative;
            overflow: hidden;
        }
        .receipt-top-stripe {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: {{ $foundation->primary_color ?: '#db2777' }};
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 24px;
            margin-bottom: 28px;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .brand-logo {
            width: 64px;
            height: 64px;
            border-radius: 12px;
            object-fit: cover;
            border: 1px solid #e2e8f0;
        }
        .brand-info h1 {
            font-size: 20px;
            color: #0f172a;
            font-weight: 800;
            letter-spacing: -0.3px;
        }
        .brand-info p {
            font-size: 12px;
            color: #64748b;
            margin-top: 2px;
        }
        .doc-meta {
            text-align: right;
        }
        .badge-verified {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .doc-meta h2 {
            font-size: 18px;
            color: #0f172a;
            font-weight: 800;
        }
        .doc-meta p {
            font-size: 13px;
            color: #64748b;
            margin-top: 2px;
        }
        .amount-hero {
            background: linear-gradient(135deg, #fdf2f8 0%, #f8fafc 100%);
            border: 1px solid #fbcfe8;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin-bottom: 28px;
        }
        .amount-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 6px;
        }
        .amount-val {
            font-size: 36px;
            font-weight: 900;
            color: {{ $foundation->primary_color ?: '#db2777' }};
            letter-spacing: -0.5px;
        }
        .amount-sub {
            font-size: 13px;
            color: #475569;
            margin-top: 4px;
            font-weight: 500;
        }
        .grid-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 28px;
        }
        .info-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px 20px;
        }
        .info-card h3 {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 8px;
            font-weight: 700;
        }
        .info-card p {
            font-size: 14px;
            color: #1e293b;
            line-height: 1.5;
        }
        .table-details {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 28px;
        }
        .table-details th {
            background: #f8fafc;
            color: #475569;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            padding: 10px 16px;
            border-bottom: 2px solid #e2e8f0;
        }
        .table-details td {
            padding: 12px 16px;
            font-size: 13px;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
        }
        .thank-you-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 16px 20px;
            border-radius: 10px;
            margin-bottom: 28px;
            text-align: center;
        }
        .thank-you-box h4 {
            font-size: 14px;
            color: #166534;
            font-weight: 700;
            margin-bottom: 4px;
        }
        .thank-you-box p {
            font-size: 13px;
            color: #15803d;
            line-height: 1.5;
        }
        .footer-legal {
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
            line-height: 1.5;
        }
        .actions-bar {
            text-align: center;
            margin-bottom: 24px;
        }
        .btn-print {
            background: {{ $foundation->primary_color ?: '#db2777' }};
            color: white;
            border: none;
            padding: 12px 28px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(219, 39, 119, 0.25);
            transition: all 0.2s;
        }
        .btn-print:hover {
            filter: brightness(0.9);
        }
        @media print {
            body {
                background: none;
                padding: 0;
            }
            .receipt-container {
                box-shadow: none;
                border: 1px solid #e2e8f0;
                padding: 30px;
            }
            .actions-bar {
                display: none;
            }
        }
    </style>
</head>
<body>

    <div class="actions-bar">
        <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
    </div>

    <div class="receipt-container">
        <div class="receipt-top-stripe"></div>

        <div class="header">
            <div class="brand">
                @if($foundation->logo_url)
                    <img src="{{ $foundation->logo_url }}" alt="{{ $foundation->name }}" class="brand-logo">
                @endif
                <div class="brand-info">
                    <h1>{{ $foundation->name }}</h1>
                    <p>{{ $foundation->legal_name }}</p>
                    <p>NIT: {{ $foundation->nit ?: 'S/N' }} • {{ $foundation->legal_id_details }}</p>
                    <p>{{ $foundation->location_city }} • {{ $foundation->contact_email }}</p>
                </div>
            </div>
            <div class="doc-meta">
                <div class="badge-verified">✓ Donación Verificada</div>
                <h2>RECIBO OFICIAL</h2>
                <p><strong>N°:</strong> REC-{{ $donation->paid_at ? $donation->paid_at->format('Ym') : now()->format('Ym') }}-{{ str_pad($donation->id, 5, '0', STR_PAD_LEFT) }}</p>
                <p><strong>Fecha:</strong> {{ $donation->paid_at ? $donation->paid_at->format('d/m/Y H:i') : now()->format('d/m/Y H:i') }} BOT</p>
            </div>
        </div>

        <div class="amount-hero">
            <div class="amount-label">Monto Total Donado</div>
            <div class="amount-val">{{ $donation->currency }} {{ number_format((float) $donation->amount, 2) }}</div>
            <div class="amount-sub">
                @if($donation->donation_type === 'recurring')
                    Aporte Solidario Mensual Recurrente
                @else
                    Aporte Solidario Único
                @endif
            </div>
        </div>

        <div class="grid-info">
            <div class="info-card">
                <h3>Datos del Donante</h3>
                <p><strong>{{ $donation->is_anonymous ? 'Donante Anónimo' : ($donor->name ?? 'Donante Solidario') }}</strong></p>
                <p>{{ $donation->is_anonymous ? 'Aporte con identidad reservada' : ($donor->email ?? 'Sin correo registrado') }}</p>
                @if(!$donation->is_anonymous && !empty($donor->phone))
                    <p>Teléfono: {{ $donor->phone }}</p>
                @endif
            </div>
            <div class="info-card">
                <h3>Causa / Destino del Aporte</h3>
                <p><strong>{{ $campaign->title ?? 'Fondo General de Tratamiento y Albergue' }}</strong></p>
                <p>Gestión y Administración: {{ $foundation->name }}</p>
            </div>
        </div>

        <table class="table-details">
            <thead>
                <tr>
                    <th>Detalle de la Transacción</th>
                    <th>Información</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Referencia de Transacción</strong></td>
                    <td><code>{{ $donation->merchant_reference_number }}</code></td>
                </tr>
                @if($donation->cybersource_request_id)
                <tr>
                    <td><strong>Request ID Pasarela (ATC Cybersource)</strong></td>
                    <td><code>{{ $donation->cybersource_request_id }}</code></td>
                </tr>
                @endif
                <tr>
                    <td><strong>Medio de Pago</strong></td>
                    <td>
                        @if($donation->payment_method === 'card')
                            Tarjeta de Crédito / Débito (Procesado por ATC Red Enlace)
                        @elseif($donation->payment_method === 'qr')
                            Transferencia QR Simple (ATC Red Enlace)
                        @else
                            {{ ucfirst($donation->payment_method) }}
                        @endif
                    </td>
                </tr>
                <tr>
                    <td><strong>Estado de la Transacción</strong></td>
                    <td><strong style="color: #059669;">✓ Aprobada y Confirmada</strong></td>
                </tr>
            </tbody>
        </table>

        <div class="thank-you-box">
            <h4>❤️ ¡Gracias por transformar vidas!</h4>
            <p>{{ $campaign->thank_you_message ?? $foundation->mission ?? 'Tu generosidad brinda esperanza, salud y bienestar a quienes más lo necesitan.' }}</p>
        </div>

        <div class="footer-legal">
            <p>Este recibo oficial es un comprobante de donación benéfica emitido por <strong>{{ $foundation->name }}</strong> a través de la plataforma tecnológica <strong>Donatio SaaS</strong>.</p>
            <p>Válido para fines informativos y de transparencia solidaria conforme a la normativa boliviana.</p>
        </div>
    </div>

</body>
</html>

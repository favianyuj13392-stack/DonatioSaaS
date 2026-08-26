<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proforma de Liquidación Mensual #{{ $proformaNumber }}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        body {
            background-color: #f8fafc;
            color: #1e293b;
            padding: 40px 20px;
        }
        .proforma-container {
            max-width: 850px;
            margin: 0 auto;
            background: #ffffff;
            padding: 48px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 24px;
            margin-bottom: 32px;
        }
        .brand h1 {
            font-size: 26px;
            color: #db2777;
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        .brand p {
            font-size: 13px;
            color: #64748b;
            margin-top: 4px;
        }
        .doc-meta {
            text-align: right;
        }
        .doc-meta h2 {
            font-size: 20px;
            color: #0f172a;
            font-weight: 700;
        }
        .doc-meta p {
            font-size: 13px;
            color: #64748b;
            margin-top: 2px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 32px;
        }
        .card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .card h3 {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 12px;
            font-weight: 700;
        }
        .card p {
            font-size: 14px;
            color: #334155;
            line-height: 1.5;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 32px;
        }
        th {
            background: #f8fafc;
            color: #475569;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            padding: 12px 16px;
            border-bottom: 2px solid #e2e8f0;
        }
        td {
            padding: 14px 16px;
            font-size: 14px;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
        }
        .text-right {
            text-align: right;
        }
        .total-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
        }
        .total-box {
            width: 320px;
            background: #fdf2f8;
            border: 2px solid #fbcfe8;
            padding: 20px;
            border-radius: 8px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: #475569;
            margin-bottom: 8px;
        }
        .total-row.grand-total {
            font-size: 18px;
            font-weight: 800;
            color: #db2777;
            border-top: 1px solid #f472b6;
            padding-top: 10px;
            margin-top: 10px;
            margin-bottom: 0;
        }
        .payment-instructions {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 32px;
        }
        .payment-instructions h4 {
            font-size: 14px;
            color: #166534;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .payment-instructions p {
            font-size: 13px;
            color: #15803d;
            line-height: 1.6;
        }
        .footer-note {
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 24px;
        }
        .actions-bar {
            text-align: center;
            margin-bottom: 24px;
        }
        .btn-print {
            background: #db2777;
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
            background: #be185d;
        }
        @media print {
            body {
                background: none;
                padding: 0;
            }
            .proforma-container {
                box-shadow: none;
                padding: 20px;
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

    <div class="proforma-container">
        <div class="header">
            <div class="brand">
                <h1>DONATIO SAAS</h1>
                <p>Plataforma de Recaudación y Suscripciones Solidarias</p>
                <p>La Paz - Bolivia • Soporte: contacto@donatio.lat</p>
            </div>
            <div class="doc-meta">
                <h2>PROFORMA DE COBRO</h2>
                <p><strong>Nro:</strong> {{ $proformaNumber }}</p>
                <p><strong>Período:</strong> {{ $periodName }}</p>
                <p><strong>Fecha de Emisión:</strong> {{ now()->format('d/m/Y') }}</p>
            </div>
        </div>

        <div class="info-grid">
            <div class="card">
                <h3>Cliente / Fundación</h3>
                <p><strong>{{ $foundation->name }}</strong></p>
                <p>NIT: {{ $foundation->nit ?: 'S/N' }}</p>
                <p>Subdominio: {{ $foundation->subdomain }}.donatio.lat</p>
                <p>Email: {{ $foundation->contact_email }}</p>
            </div>
            <div class="card">
                <h3>Resumen del Período</h3>
                <p><strong>Total Donaciones:</strong> {{ $donationsCount }} transacciones</p>
                <p><strong>Tarifas Pactadas:</strong> Tarjetas {{ $foundation->saas_fee_card }}% | QR {{ $foundation->saas_fee_qr }}%</p>
                <p><strong>Tipo de Cambio Oficial:</strong> 1 USD = {{ number_format($exchangeRate, 2) }} BOB</p>
                <p><strong>Estado:</strong> {{ $isPaid ? '✓ COBRADO Y LIQUIDADO' : '⏳ PENDIENTE DE TRANSFERENCIA' }}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Concepto / Método</th>
                    <th class="text-right">Transacciones</th>
                    <th class="text-right">Volumen Bruto</th>
                    <th class="text-right">Tasa SaaS</th>
                    <th class="text-right">Comisión Donatio</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>Aportes por Tarjetas (ATC Cybersource)</strong><br>
                        <small style="color: #64748b;">Donaciones únicas y débitos mensuales recurrentes 3DS2</small>
                    </td>
                    <td class="text-right">{{ $cardCount }}</td>
                    <td class="text-right">Bs. {{ number_format($cardGrossBob, 2) }}</td>
                    <td class="text-right">{{ $foundation->saas_fee_card }}%</td>
                    <td class="text-right"><strong>Bs. {{ number_format($cardSaasFeeBob, 2) }}</strong></td>
                </tr>
                <tr>
                    <td>
                        <strong>Aportes por Código QR (ATC Simple)</strong><br>
                        <small style="color: #64748b;">Donaciones directas por transferencia QR interbancario</small>
                    </td>
                    <td class="text-right">{{ $qrCount }}</td>
                    <td class="text-right">Bs. {{ number_format($qrGrossBob, 2) }}</td>
                    <td class="text-right">{{ $foundation->saas_fee_qr }}%</td>
                    <td class="text-right"><strong>Bs. {{ number_format($qrSaasFeeBob, 2) }}</strong></td>
                </tr>
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-box">
                <div class="total-row">
                    <span>Total Recaudado (GMV):</span>
                    <span>Bs. {{ number_format($totalGrossBob, 2) }}</span>
                </div>
                <div class="total-row">
                    <span>Arancel ATC Est. (~2.45%):</span>
                    <span>Bs. {{ number_format($totalAtcFeeBob, 2) }}</span>
                </div>
                <div class="total-row">
                    <span>Neto Acreditado a ONG:</span>
                    <span>Bs. {{ number_format($totalGrossBob - ($totalSaasFeeBob + $totalAtcFeeBob), 2) }}</span>
                </div>
                <div class="total-row grand-total">
                    <span>TOTAL A PAGAR:</span>
                    <span>Bs. {{ number_format($totalSaasFeeBob, 2) }}</span>
                </div>
            </div>
        </div>

        <div class="payment-instructions">
            <h4>🏦 Instrucciones para Transferencia Bancaria</h4>
            <p>Favor realizar la transferencia de la comisión del 2% a la siguiente cuenta bancaria:</p>
            <p><strong>Banco:</strong> Banco Mercantil Santa Cruz / BCP</p>
            <p><strong>Titular:</strong> Donatio SaaS Bolivia (Empresa Unipersonal)</p>
            <p><strong>Número de Cuenta:</strong> 4010-894726-01-2 (Cta. Corriente en Bolivianos)</p>
            <p><strong>Glosa Obligatoria:</strong> Comisión SaaS {{ $periodName }} - {{ $foundation->code }}</p>
            <p style="margin-top: 8px; font-size: 12px; color: #166534;">* Una vez realizada la transferencia, enviar el comprobante digital para la emisión de la Factura Electrónica SIAT correspondiente.</p>
        </div>

        <div class="footer-note">
            <p>Documento generado electrónicamente por Donatio SaaS Engine • Válido para trámite contable de liquidación mensual.</p>
        </div>
    </div>

</body>
</html>

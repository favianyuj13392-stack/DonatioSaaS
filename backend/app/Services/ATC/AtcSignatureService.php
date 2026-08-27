<?php

namespace App\Services\ATC;

use App\Models\Foundation;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AtcSignatureService
{
    /**
     * Retorna el Host de Cybersource según el entorno del tenant (Sandbox vs Prod).
     */
    public static function getHost(Foundation $tenant): string
    {
        return $tenant->is_sandbox ? 'apitest.cybersource.com' : 'api.cybersource.com';
    }

    /**
     * Construye las cabeceras HTTP autenticadas con firma HMAC-SHA256 en memoria para el tenant.
     */
    public static function generateAuthHeaders(Foundation $tenant, string $method, string $path, ?string $bodyJson = null): array
    {
        $host       = self::getHost($tenant);
        $dateStr    = gmdate('D, d M Y H:i:s GMT');
        $merchantId = (string) $tenant->atc_merchant_id;
        $apiKeyId   = (string) $tenant->atc_api_key_id;
        $secretKey  = (string) $tenant->atc_secret_key;

        $methodLower = strtolower($method);

        if (in_array($methodLower, ['post', 'put', 'patch']) && $bodyJson !== null) {
            $digest = 'SHA-256=' . base64_encode(hash('sha256', $bodyJson, true));
            $signedHeaders = '(request-target) host date digest v-c-merchant-id';
            $signatureString = "(request-target): {$methodLower} {$path}\n" .
                "host: {$host}\n" .
                "date: {$dateStr}\n" .
                "digest: {$digest}\n" .
                "v-c-merchant-id: {$merchantId}";
        } else {
            $digest = null;
            $signedHeaders = '(request-target) host date v-c-merchant-id';
            $signatureString = "(request-target): {$methodLower} {$path}\n" .
                "host: {$host}\n" .
                "date: {$dateStr}\n" .
                "v-c-merchant-id: {$merchantId}";
        }

        $secretKeyDecoded = base64_decode($secretKey, true) ?: $secretKey;
        $signatureHash    = hash_hmac('sha256', $signatureString, $secretKeyDecoded, true);
        $signatureBase64  = base64_encode($signatureHash);

        $signatureHeader = sprintf(
            'keyid="%s", algorithm="HmacSHA256", headers="%s", signature="%s"',
            $apiKeyId,
            $signedHeaders,
            $signatureBase64
        );

        $headers = [
            'v-c-merchant-id' => $merchantId,
            'Date'            => $dateStr,
            'Host'            => $host,
            'Signature'       => $signatureHeader,
            'Content-Type'    => 'application/json',
            'Accept'          => 'application/json',
        ];

        if ($digest) {
            $headers['Digest'] = $digest;
        }

        return $headers;
    }

    /**
     * Ejecuta una petición HTTP autenticada a Cybersource para el tenant.
     * Implementa timeouts explícitos de conexión (5s) y lectura (20s) sin reintentos automáticos ciegos.
     */
    public static function request(Foundation $tenant, string $method, string $path, ?array $payload = null): array
    {
        $host = self::getHost($tenant);
        $url = "https://{$host}{$path}";
        $bodyJson = $payload ? json_encode($payload, JSON_UNESCAPED_SLASHES) : null;
        $headers = self::generateAuthHeaders($tenant, $method, $path, $bodyJson);

        $connectTimeout = $tenant->is_sandbox ? 3 : 5;
        $timeoutSeconds = $tenant->is_sandbox ? 10 : 20;

        $httpClient = Http::withHeaders($headers)
            ->connectTimeout($connectTimeout)
            ->timeout($timeoutSeconds);

        $response = match (strtoupper($method)) {
            'GET'    => $httpClient->get($url),
            'POST'   => $httpClient->withBody($bodyJson ?? '', 'application/json')->post($url),
            'PUT'    => $httpClient->withBody($bodyJson ?? '', 'application/json')->put($url),
            'DELETE' => $httpClient->delete($url),
            default  => throw new Exception("Método HTTP {$method} no soportado para Cybersource"),
        };

        $result = $response->json();

        if (!$response->successful()) {
            $statusCode = $response->status();
            $rawBody = $response->body();
            Log::error("Cybersource Error [{$statusCode}] en {$path}: {$rawBody}");
            $errorMessage = $result['message'] ?? $result['errorInformation']['message'] ?? $rawBody ?? 'Error en comunicación con Cybersource';
            throw new Exception("Error Cybersource ({$statusCode}): {$errorMessage}", $statusCode);
        }

        return $result ?? [];
    }
}

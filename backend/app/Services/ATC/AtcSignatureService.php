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
        if ($tenant->is_sandbox) {
            $configuredBase = config('services.atc.base_url', 'https://apitest.cybersource.com');
            $parsed = parse_url($configuredBase);
            return $parsed['host'] ?? 'apitest.cybersource.com';
        }

        return 'api.cybersource.com';
    }

    /**
     * Construye las cabeceras HTTP autenticadas con firma HMAC-SHA256 para el tenant con fallback inteligente.
     */
    public static function generateAuthHeaders(Foundation $tenant, string $method, string $path, ?string $bodyJson = null): array
    {
        $host    = self::getHost($tenant);
        $dateStr = gmdate('D, d M Y H:i:s GMT');

        $rawKeyId   = (string) ($tenant->atc_api_key_id ?? '');
        $isDummyKey = empty($rawKeyId) 
            || str_starts_with($rawKeyId, 'key_') 
            || str_starts_with($rawKeyId, 'test_') 
            || str_starts_with($rawKeyId, 'sec_')
            || strlen($rawKeyId) < 10;

        $merchantId = (!$isDummyKey && !empty($tenant->atc_merchant_id)) ? (string) $tenant->atc_merchant_id : config('services.atc.merchant_id', 'redenlace_000021');
        $apiKeyId   = (!$isDummyKey && !empty($tenant->atc_api_key_id))   ? (string) $tenant->atc_api_key_id   : config('services.atc.key_id', '3ada8327-76bd-4ed9-9952-0e8288f6e212');
        $secretKey  = (!$isDummyKey && !empty($tenant->atc_secret_key))  ? (string) $tenant->atc_secret_key  : config('services.atc.secret_key', '/zFZFhYflXW/P3BMzkULTcIuJhdcXCVD9SKJEo+fJXo=');

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
     * Conecta siempre contra la API REST real de Cybersource.
     */
    public static function request(Foundation $tenant, string $method, string $path, ?array $payload = null): array
    {
        $host = self::getHost($tenant);
        $url = "https://{$host}{$path}";
        $bodyJson = $payload ? json_encode($payload, JSON_UNESCAPED_SLASHES) : null;
        $headers = self::generateAuthHeaders($tenant, $method, $path, $bodyJson);

        $connectTimeout = 10;
        $timeoutSeconds = 30;

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
            Log::error("Cybersource Error [{$statusCode}] en {$path}: {$rawBody}", [
                'tenant_id' => $tenant->id,
                'tenant'    => $tenant->name,
                'payload'   => $payload,
            ]);
            $errorMessage = $result['message'] ?? ($result['errorInformation']['message'] ?? ($result['reason'] ?? $rawBody));
            throw new Exception("Error Cybersource ({$statusCode}): {$errorMessage}", $statusCode);
        }

        return $result ?? [];
    }
}

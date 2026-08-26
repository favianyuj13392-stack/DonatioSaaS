<?php

namespace Tests\Unit;

use App\Models\Foundation;
use App\Services\ATC\AtcSignatureService;
use Tests\TestCase;

class AtcSignatureTest extends TestCase
{
    /**
     * Prueba la generación de cabeceras HTTP Signature con HMAC-SHA256 para Cybersource.
     */
    public function test_generates_valid_hmac_sha256_signature_headers(): void
    {
        $tenant = new Foundation([
            'atc_merchant_id' => 'redenlace_000021',
            'atc_api_key_id'  => 'test_api_key_123',
            'atc_secret_key'  => base64_encode('secret_key_mock_32_bytes_long_hmac!'),
            'is_sandbox'      => true,
        ]);

        $payload = ['clientReferenceInformation' => ['code' => 'TEST-REF-1001']];
        $bodyJson = json_encode($payload);

        $headers = AtcSignatureService::generateAuthHeaders(
            $tenant,
            'POST',
            '/pts/v2/payments',
            $bodyJson
        );

        $this->assertArrayHasKey('Host', $headers);
        $this->assertEquals('apitest.cybersource.com', $headers['Host']);

        $this->assertArrayHasKey('Date', $headers);
        $this->assertArrayHasKey('v-c-merchant-id', $headers);
        $this->assertEquals('redenlace_000021', $headers['v-c-merchant-id']);

        $this->assertArrayHasKey('Digest', $headers);
        $this->assertStringStartsWith('SHA-256=', $headers['Digest']);

        $this->assertArrayHasKey('Signature', $headers);
        $this->assertStringContainsString('keyid="test_api_key_123"', $headers['Signature']);
        $this->assertStringContainsString('algorithm="HmacSHA256"', $headers['Signature']);
        $this->assertStringContainsString('signature="', $headers['Signature']);
    }
}

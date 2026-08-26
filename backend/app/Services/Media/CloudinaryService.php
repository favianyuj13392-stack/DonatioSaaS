<?php

namespace App\Services\Media;

use Cloudinary\Cloudinary;
use Cloudinary\Configuration\Configuration;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    protected Cloudinary $cloudinary;

    public function __construct()
    {
        $cloudName = config('cloudinary.cloud_name') ?: env('CLOUDINARY_CLOUD_NAME');
        $apiKey = config('cloudinary.api_key') ?: env('CLOUDINARY_API_KEY');
        $apiSecret = config('cloudinary.api_secret') ?: env('CLOUDINARY_API_SECRET');

        $config = new Configuration();
        $config->cloud->cloudName = $cloudName;
        $config->cloud->apiKey = $apiKey;
        $config->cloud->apiSecret = $apiSecret;
        $config->url->secure = true;

        $this->cloudinary = new Cloudinary($config);
    }

    /**
     * Sube un archivo a Cloudinary y retorna la URL HTTPS segura y optimizada.
     */
    public function upload(UploadedFile|string $file, string $folder = 'donatio/media', array $transformations = []): string
    {
        try {
            $filePath = ($file instanceof UploadedFile) ? $file->getRealPath() : $file;

            $options = [
                'folder'        => $folder,
                'resource_type' => 'image',
                'transformation' => array_merge([
                    'quality'      => 'auto',
                    'fetch_format' => 'auto',
                ], $transformations),
            ];

            $uploadResult = $this->cloudinary->uploadApi()->upload($filePath, $options);

            return $uploadResult['secure_url'];
        } catch (Exception $e) {
            Log::error("Error subiendo imagen a Cloudinary: " . $e->getMessage());
            throw new Exception("Error al procesar y subir imagen a Cloudinary: " . $e->getMessage());
        }
    }

    /**
     * Sube un logotipo institucional de fundación con optimización de dimensiones.
     */
    public function uploadLogo(UploadedFile|string $file, string $subdomain): string
    {
        return $this->upload($file, "donatio/tenants/{$subdomain}/logos", [
            'width' => 400,
            'crop'  => 'limit',
        ]);
    }

    /**
     * Sube un banner de campaña con optimización panorámica.
     */
    public function uploadBanner(UploadedFile|string $file, string $subdomain): string
    {
        return $this->upload($file, "donatio/tenants/{$subdomain}/banners", [
            'width' => 1280,
            'crop'  => 'limit',
        ]);
    }

    /**
     * Valida la conexión y credenciales con Cloudinary.
     */
    public function testConnection(): array
    {
        try {
            $ping = $this->cloudinary->adminApi()->ping();
            return [
                'status'  => 'success',
                'message' => 'Conexión exitosa con Cloudinary CDN.',
                'data'    => $ping,
            ];
        } catch (Exception $e) {
            return [
                'status'  => 'error',
                'message' => 'Error de autenticación con Cloudinary: ' . $e->getMessage(),
            ];
        }
    }
}

<?php

namespace App\Console\Commands;

use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class BackupDatabaseToR2Command extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'donatio:backup-db {--keep=14 : Días para retención de backups}';

    /**
     * The console command description.
     */
    protected $description = 'Genera un volcado comprimido de PostgreSQL 16 y lo sube de forma inmutable a Cloudflare R2';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Iniciando volcado de base de datos PostgreSQL 16 para Cloudflare R2...');

        $timestamp = now()->format('Y-m-d_His');
        $filename = "backup_donatio_saas_{$timestamp}.sql.gz";
        $tempPath = storage_path("app/{$filename}");

        $host = config('database.connections.pgsql.host');
        $port = config('database.connections.pgsql.port', '5432');
        $db = config('database.connections.pgsql.database');
        $user = config('database.connections.pgsql.username');
        $pass = config('database.connections.pgsql.password');

        putenv("PGPASSWORD={$pass}");

        $cmd = "pg_dump -h {$host} -p {$port} -U {$user} -d {$db} --no-owner --clean | gzip > " . escapeshellarg($tempPath);

        exec($cmd, $output, $returnCode);

        if ($returnCode !== 0 || !file_exists($tempPath) || filesize($tempPath) === 0) {
            $this->error('✗ Error generando el volcado con pg_dump.');
            Log::error("Fallo en BackupDatabaseToR2Command: pg_dump retornó código {$returnCode}");
            return Command::FAILURE;
        }

        $sizeBytes = filesize($tempPath);
        $sizeMb = round($sizeBytes / 1024 / 1024, 2);
        $this->info("✓ Volcado generado localmente: {$filename} ({$sizeMb} MB)");

        try {
            $r2Path = "backups/{$filename}";
            $this->info("Subiendo volcado a Cloudflare R2: {$r2Path}...");

            $stream = fopen($tempPath, 'r');
            Storage::disk('r2')->put($r2Path, $stream);
            if (is_resource($stream)) {
                fclose($stream);
            }

            $this->info("✓ Backup subido exitosamente a Cloudflare R2 ({$r2Path}).");
            Log::info("Backup subido exitosamente a Cloudflare R2: {$r2Path} ({$sizeMb} MB)");

            // Limpieza local
            @unlink($tempPath);

            return Command::SUCCESS;
        } catch (Exception $e) {
            $this->error("✗ Error subiendo backup a Cloudflare R2: {$e->getMessage()}");
            Log::error("Error subiendo backup a Cloudflare R2: {$e->getMessage()}");
            @unlink($tempPath);
            return Command::FAILURE;
        }
    }
}

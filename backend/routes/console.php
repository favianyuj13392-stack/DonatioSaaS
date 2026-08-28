<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\ProcessRecurringDonationsCommand;
use App\Console\Commands\SyncExchangeRateCommand;
use App\Console\Commands\BackupDatabaseToR2Command;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// 1. Programar cobros recurrentes de donaciones todos los días a las 02:00 AM
Schedule::command(ProcessRecurringDonationsCommand::class)->dailyAt('02:00');

// 2. Sincronizar Tipo de Cambio Oficial BCB (USD/BOB) de lunes a viernes a las 20:05 BOT
Schedule::command(SyncExchangeRateCommand::class)->weekdays()->at('20:05')->timezone('America/La_Paz');

// 3. Backup diario inmutable de la base de datos PostgreSQL a Cloudflare R2 a las 03:00 AM
Schedule::command(BackupDatabaseToR2Command::class)->dailyAt('03:00');

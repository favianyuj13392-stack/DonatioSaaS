<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\ProcessRecurringDonationsCommand;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Programar cobros recurrentes de donaciones todos los días a las 02:00 AM
Schedule::command(ProcessRecurringDonationsCommand::class)->dailyAt('02:00');

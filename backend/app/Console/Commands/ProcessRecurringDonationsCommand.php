<?php

namespace App\Console\Commands;

use App\Jobs\ProcessSubscriptionBillingJob;
use App\Models\Subscription;
use Illuminate\Console\Command;

class ProcessRecurringDonationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'donatio:process-recurring-donations';

    /**
     * The console command description.
     */
    protected $description = 'Despacha los cobros automáticos diarios (MIT 02:00 AM) de socios recurrentes a colas Redis con rate limiting e idempotencia';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $today = now()->toDateString();
        $this->info("Iniciando despacho asíncrono de cobros recurrentes para la fecha: {$today}");

        $dispatchedCount = 0;

        // Uso de cursor() para consumo O(1) de memoria RAM sin importar la cantidad de suscripciones
        $subscriptionsQuery = Subscription::withoutGlobalScopes()
            ->where('status', 'active')
            ->where('next_billing_date', '<=', $today);

        foreach ($subscriptionsQuery->cursor() as $subscription) {
            ProcessSubscriptionBillingJob::dispatch($subscription->id, $today)->onQueue('billing');
            $dispatchedCount++;
        }

        $this->info("✓ Se despacharon {$dispatchedCount} cobros recurrentes a la cola de Redis 'billing'.");

        return Command::SUCCESS;
    }
}

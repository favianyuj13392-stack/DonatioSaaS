<div class="p-4 space-y-4">
    <div class="grid grid-cols-2 gap-4 text-xs font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
        <div><span class="font-bold text-gray-500">Request ID (RID):</span> <span class="text-blue-600 dark:text-blue-400">{{ $rid ?? 'N/A' }}</span></div>
        <div><span class="font-bold text-gray-500">ECI 3DS2:</span> <span class="text-emerald-600 dark:text-emerald-400">{{ $eci ?? 'N/A' }}</span></div>
    </div>
    <div>
        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Payload Completo de la Pasarela:</label>
        <pre class="bg-gray-900 text-emerald-400 p-3 rounded text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">{{ $json ?? '{}' }}</pre>
    </div>
</div>

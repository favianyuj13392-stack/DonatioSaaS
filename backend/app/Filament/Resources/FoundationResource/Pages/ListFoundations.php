<?php

namespace App\Filament\Resources\FoundationResource\Pages;

use App\Filament\Resources\FoundationResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListFoundations extends ListRecords
{
    protected static string $resource = FoundationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}

<?php

namespace App\Filament\Resources\CampaignResource\Pages;

use App\Filament\Resources\CampaignResource;
use Filament\Resources\Pages\CreateRecord;

class CreateCampaign extends CreateRecord
{
    protected static string $resource = CampaignResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        if (auth()->check() && !auth()->user()->isSuperAdmin()) {
            $data['foundation_id'] = auth()->user()->foundation_id;
        }

        return $data;
    }
}

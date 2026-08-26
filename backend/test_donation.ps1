$headers = @{
    "Content-Type" = "application/json"
    "Accept" = "application/json"
    "X-Tenant-Subdomain" = "esperanza"
}

Write-Host "--- 1. Testing 3DS Setup ---"
$setupBody = @{
    card_number = "4000123456789010"
    expiration_month = "12"
    expiration_year = "2028"
} | ConvertTo-Json

$setupRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/donations/3ds-setup" -Method Post -Headers $headers -Body $setupBody
$setupRes | ConvertTo-Json -Depth 5

$refNo = $setupRes.merchant_reference_number
$refId = $setupRes.data.referenceId

Write-Host "--- 2. Testing 3DS Enrollment (AVS + ThreatMetrix) ---"
$enrollBody = @{
    reference_id = $refId
    merchant_reference_number = $refNo
    amount = 150
    currency = "BOB"
    card_number = "4000123456789010"
    expiration_month = "12"
    expiration_year = "2028"
    cvv = "123"
    first_name = "Carlos"
    last_name = "Mamani"
    donor_email = "carlos.mamani@test.bo"
    country = "BO"
    state = "L"
    locality = "La Paz"
    address1 = "Av. 6 de Agosto #2170"
    postal_code = "0000"
    fingerprint_session_id = "redenlace_000021_guid_test_12345"
} | ConvertTo-Json

$enrollRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/donations/3ds-enrollment" -Method Post -Headers $headers -Body $enrollBody
$enrollRes | ConvertTo-Json -Depth 5

Write-Host "--- 3. Testing Final Donation Checkout ---"
$checkoutBody = @{
    campaign_id = 1
    amount = 150
    currency = "BOB"
    frequency = "single"
    donor_name = "Carlos Mamani"
    donor_email = "carlos.mamani@test.bo"
    is_anonymous = $false
    merchant_reference_number = $refNo
    card_number = "4000123456789010"
    expiration_month = "12"
    expiration_year = "2028"
    cvv = "123"
    country = "BO"
    state = "L"
    locality = "La Paz"
    address1 = "Av. 6 de Agosto #2170"
    postal_code = "0000"
    fingerprint_session_id = "redenlace_000021_guid_test_12345"
    cavv = $enrollRes.cavv
    eci_raw = $enrollRes.eci
    three_ds_server_transaction_id = $enrollRes.threeDSServerTransactionId
    accepted_terms = $true
} | ConvertTo-Json

$checkoutRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/donations/checkout" -Method Post -Headers $headers -Body $checkoutBody
$checkoutRes | ConvertTo-Json -Depth 5

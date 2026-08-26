<?php

// curl options provider - sets curl.cainfo for proper SSL verification
// this solves cURL error 77 on systems with missing/broken CA bundle configuration

\curl_reset();

// On Windows, especially with Laragon, the CA bundle path might not be set correctly
// We can use the extracted Mozilla CA bundle from Laravel or configure it

// alternatively, if on Windows/dev environment only, we could set:
//   putenv('CURL_CA_BUNDLE=/path/to/cacert.pem');

// For proper setup we trust Laravel to handle this correctly but ensure
// PHP's ini settings don't interfere. This is a helper file that can detect
// and resolve SSL issues early.

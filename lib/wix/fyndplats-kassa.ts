// Fyndplats kassa: Wix-appen som bär kassans trygghetsblock och sedan
// 2026-10-27 tillägget Ecom Validations "Postnummerspärr Aosom". Appen är
// byggd med Wix CLI och installerad på butikens sajt.
//
// Wix signerar tilläggets anrop till /api/wix-validering med appens nyckel, och
// anropets `aud` är appens id. Nyckeln är publik och står i appens panel:
// Home → … → View ID & keys → Public key. Appens hemliga nyckel (App Secret Key)
// används inte av motorn och hör inte hemma i repot.
//
// Varje Wix-app har en egen nyckel. Orderwebhooken signeras av en annan app,
// så `WIX_WEBHOOK_PUBLIC_KEY` verifierar inte kassans anrop.

export const FYNDPLATS_KASSA_APP_ID = "97c377e3-1714-4f26-b60b-1175ec49c0ad";

export const FYNDPLATS_KASSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoLx3xdMfgE6pjZ6oUFXp
hUCY1ZyJ0xMv7ziZWqOsPzyTNc+ExCPPDS51Uet1k8mIhdT+GdWuby6rH4H2pSI2
cWonxAhKZEbjcrHBWua7NXIdi2K9NtNcsk9WsT6CuRrNqMWcgolfB+V9KKK2k+UU
m6Lo2MKlHBOGPf+lANnhLkkRAsKfhjW1DZfP9Jut0Y1KddxekkLcSDVVK+en8QYt
8iu2fdrMvMy3QUdWbI3gW+WmOTxsd93LrfPG+RZbfa5numocTjG23hB77bM5OkPd
th77yQAI4XKd1/r6kMV8v5wY1ExPXXqA+qnaHcHyNVFTBehKVcxPKD/1Iiv7b6go
oQIDAQAB
-----END PUBLIC KEY-----
`;

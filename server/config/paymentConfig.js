/**
 * Secure payment configuration placeholder.
 * Replace the sample values with real credentials/keys on your deployment.
 * NEVER commit production secrets to source control.
 */

module.exports = {
  paypal: {
    clientId: "PAYPAL_SAMPLE_CLIENT_ID",
    clientSecret: "PAYPAL_SAMPLE_CLIENT_SECRET",
    webhookId: "PAYPAL_SAMPLE_WEBHOOK_ID",
  },
  mellat: {
    terminalId: "MELLAT_SAMPLE_TERMINAL_ID",
    username: "MELLAT_SAMPLE_USERNAME",
    password: "MELLAT_SAMPLE_PASSWORD",
    callbackUrl: "https://example.com/payments/mellat/callback",
  },
  wallet: {
    encryptionKey: "WALLET_SAMPLE_ENCRYPTION_KEY",
    initialBalance: 0,
    currency: "IRR",
  },
};

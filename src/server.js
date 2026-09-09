const path = require('path');

// Local dev only: load .env.local first (gitignored, real dev secrets), then
// fall back to .env for defaults. Neither is used in production — there,
// KEY_VAULT_URL is set and secrets.js pulls from Azure Key Vault instead.
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { loadSecrets } = require('./config/secrets');

async function bootstrap() {
  try {
    console.log('Loading secrets...');
    const secrets = await loadSecrets();

    if (secrets.databaseUrl) process.env.DATABASE_URL = secrets.databaseUrl;
    if (secrets.jwtSecret) process.env.JWT_SECRET = secrets.jwtSecret;
    if (secrets.adClientSecret) process.env.AD_CLIENT_SECRET = secrets.adClientSecret;
    if (secrets.aiApiKey) process.env.AI_API_KEY = secrets.aiApiKey;
    if (secrets.peerKeyOutHash) process.env.PEER_KEY_OUT_HASH = secrets.peerKeyOutHash;
    if (secrets.peerKeyIn) process.env.PEER_KEY_IN = secrets.peerKeyIn;

    if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
      throw new Error('DATABASE_URL and JWT_SECRET must be resolvable (Key Vault or local .env.local)');
    }

    // Required only AFTER secrets are resolved into process.env, since
    // PrismaClient reads DATABASE_URL at instantiation time.
    const createApp = require('./app');
    const app = createApp();

    const port = process.env.PORT || 4002;
    app.listen(port, () => {
      console.log(`CampusStore API running on port ${port} (base path: ${process.env.BASE_PATH || '/campus-store'})`);
    });
  } catch (error) {
    console.error('CRITICAL: Failed to bootstrap CampusStore server:', error);
    process.exit(1);
  }
}

bootstrap();

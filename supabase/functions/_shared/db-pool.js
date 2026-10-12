import pg from 'pg';

const { Pool } = pg;

export function buildDbConfig(overrides = {}) {
  const connectionString = String(
    overrides.connectionString ?? process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? ''
  ).trim();
  const instanceConnectionName = String(
    overrides.instanceConnectionName ?? process.env.INSTANCE_CONNECTION_NAME ?? ''
  ).trim();

  const poolConfig = {
    max: Number(overrides.max ?? process.env.DB_POOL_MAX ?? 5),
    idleTimeoutMillis: Number(overrides.idleTimeoutMillis ?? 30000),
    connectionTimeoutMillis: Number(overrides.connectionTimeoutMillis ?? 10000)
  };

  if (connectionString) {
    return {
      connectionString,
      ...poolConfig
    };
  }

  return {
    user: overrides.user ?? process.env.DB_USER ?? 'postgres',
    password: overrides.password ?? process.env.DB_PASSWORD ?? '',
    database: overrides.database ?? process.env.DB_NAME ?? 'tax_consult_app',
    host: overrides.host ?? (
      instanceConnectionName
        ? `/cloudsql/${instanceConnectionName}`
        : (process.env.DB_HOST || '127.0.0.1')
    ),
    port: Number(overrides.port ?? process.env.DB_PORT ?? 5432),
    ...poolConfig
  };
}

export function createDbPool(overrides = {}) {
  return new Pool(buildDbConfig(overrides));
}


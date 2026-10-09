const EmbeddedPostgres = require('embedded-postgres').default;
const path = require('path');
const fs = require('fs');

async function main() {
  const dataDir = path.resolve(__dirname, '../.pgdata');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const port = parseInt(process.env.PGPORT || '5433', 10);
  console.log(`Starting embedded PostgreSQL on port ${port}...`);
  console.log(`Data directory: ${dataDir}`);

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: port,
    user: 'postgres',
    password: 'postgrespassword',
    initialDatabase: 'markethub',
    persistent: true,
  });

  try {
    await pg.initialise();
    console.log('PostgreSQL initialized.');
  } catch (err) {
    console.log('PostgreSQL initialise note:', err.message);
  }

  await pg.start();
  console.log(`PostgreSQL is RUNNING on port ${port}!`);
  console.log(`Connection URL: postgresql://postgres:postgrespassword@localhost:${port}/markethub`);

  // Keep alive
  setInterval(() => {}, 10000);

  process.on('SIGINT', async () => {
    console.log('Stopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await pg.stop();
    process.exit(0);
  });
}

main().catch(console.error);

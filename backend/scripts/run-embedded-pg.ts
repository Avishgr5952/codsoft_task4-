import EmbeddedPostgres from 'embedded-postgres';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const dataDir = path.resolve(__dirname, '../.pgdata');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log(`Starting embedded PostgreSQL on port 5432 with data directory: ${dataDir}`);
  
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: 5432,
    user: 'postgres',
    password: 'postgrespassword',
    initialDatabase: 'markethub',
    persistent: true,
  });

  try {
    await pg.initialise();
    console.log('PostgreSQL initialised.');
  } catch (err: any) {
    console.log('PostgreSQL already initialised or notice:', err.message);
  }

  await pg.start();
  console.log('PostgreSQL is running at postgresql://postgres:postgrespassword@localhost:5432/markethub');

  // Keep process running
  process.on('SIGINT', async () => {
    console.log('Stopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });
}

main().catch(console.error);

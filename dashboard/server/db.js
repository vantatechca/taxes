require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const DEFAULT_SEED = {
  plrSources: [
    { id: 'plr-1', name: 'PLR.me', url: 'https://www.plr.me', type: 'plr', categories: ['business', 'health', 'self-help'], notes: 'Large library, monthly subscription' },
    { id: 'plr-2', name: 'IDPLR', url: 'https://www.idplr.com', type: 'plr', categories: ['ebooks', 'software', 'templates'], notes: 'Lifetime access option' },
    { id: 'plr-3', name: 'BuyQualityPLR', url: 'https://buyqualityplr.com', type: 'plr', categories: ['health', 'business', 'finance'], notes: 'Curated quality content' },
    { id: 'plr-4', name: 'BigProductStore', url: 'https://www.bigproductstore.com', type: 'plr', categories: ['ebooks', 'videos', 'graphics'], notes: '500k+ products' },
    { id: 'plr-5', name: 'MasterResellRights', url: 'https://www.masterresellrights.com', type: 'mrr', categories: ['ebooks', 'software'], notes: 'Classic MRR marketplace' },
    { id: 'plr-6', name: 'Creative Fabrica', url: 'https://www.creativefabrica.com', type: 'marketplace', categories: ['fonts', 'graphics', 'crafts', 'templates'], notes: 'Commercial license available' },
    { id: 'plr-7', name: 'TemplateMonster', url: 'https://www.templatemonster.com', type: 'marketplace', categories: ['website templates', 'presentations', 'graphics'], notes: 'Reseller program available' },
    { id: 'plr-8', name: 'Gumroad', url: 'https://gumroad.com', type: 'marketplace', categories: ['all'], notes: 'Browse trending digital products for ideas' },
  ],
  goldenRules: [
    'Prioritize evergreen products over seasonal trends',
    'Google Trends score must be above 40 to consider',
    'Products under $5 are not worth reselling',
    'Prefer products with at least 100 reviews on Etsy as validation',
  ],
};

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS collections (
      name VARCHAR(100) PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'member',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

const INITIAL_USERS = [
  { name: 'Andrei', email: 'andrei@empire.com', password: 'andrei123', role: 'owner' },
  { name: 'Jerome', email: 'jerome@empire.com', password: 'jerome123', role: 'lead' },
  { name: 'Joanne', email: 'joanne@empire.com', password: 'joanne123', role: 'lead' },
];

async function seedUsers() {
  for (const u of INITIAL_USERS) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (!existing.rows.length) {
      const hash = await bcrypt.hash(u.password, 12);
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [u.name, u.email, hash, u.role]
      );
      console.log(`[seed] Created user: ${u.name} (${u.role})`);
    }
  }
}

async function seedDB() {
  for (const [name, data] of Object.entries(DEFAULT_SEED)) {
    const existing = await getCollection(name);
    if (!existing || existing.length === 0) {
      await updateCollection(name, data);
      console.log(`[seed] Seeded ${name} with ${data.length} records`);
    }
  }
  await seedUsers();
}

async function getCollection(name) {
  const result = await pool.query(
    'SELECT data FROM collections WHERE name = $1',
    [name]
  );
  return result.rows.length ? result.rows[0].data : [];
}

async function updateCollection(name, data) {
  await pool.query(
    `INSERT INTO collections (name, data) VALUES ($1, $2::jsonb)
     ON CONFLICT (name) DO UPDATE SET data = $2::jsonb, updated_at = NOW()`,
    [name, JSON.stringify(data)]
  );
  return true;
}

async function readDB() {
  const result = await pool.query('SELECT name, data FROM collections');
  const db = {};
  result.rows.forEach((row) => { db[row.name] = row.data; });
  return db;
}

module.exports = { pool, initDB, seedDB, readDB, getCollection, updateCollection };

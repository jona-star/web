const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'bransworld.sqlite');

let dbInstance = null;

function openDatabase() {
  if (dbInstance) return dbInstance;
  dbInstance = new sqlite3.Database(DB_PATH);
  return dbInstance;
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function createSchema(db) {
  await run(db, `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(db, `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  await run(db, `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    category_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )`);
}

async function seed(db) {
  const admin = await get(db, 'SELECT id FROM users WHERE username = ?', ['admin']);
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    await run(db, 'INSERT INTO users (username, password_hash) VALUES (?, ?)', ['admin', hash]);
  }

  const categories = ['Hombre', 'Mujer', 'Niños', 'Accesorios'];
  for (const name of categories) {
    await run(db, 'INSERT OR IGNORE INTO categories (name) VALUES (?)', [name]);
  }

  const countRow = await get(db, 'SELECT COUNT(*) as c FROM products');
  if (!countRow || countRow.c === 0) {
    const catRows = await all(db, 'SELECT id, name FROM categories');
    const nameToId = Object.fromEntries(catRows.map((c) => [c.name, c.id]));
    const items = [
      { name: 'Cazadora Noir Minimal', desc: 'Chaqueta negra minimalista de corte recto.', price: 89.99, img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop', cat: 'Hombre' },
      { name: 'Camisa Carbón Slim', desc: 'Camisa ajustada en tono carbón.', price: 39.99, img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop', cat: 'Hombre' },
      { name: 'Vestido Eclipse', desc: 'Vestido midi en negro profundo.', price: 59.99, img: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=1200&auto=format&fit=crop', cat: 'Mujer' },
      { name: 'Blazer Obsidiana', desc: 'Blazer estructurado con solapa amplia.', price: 99.99, img: 'https://images.unsplash.com/photo-1542060748-10c28b62716c?q=80&w=1200&auto=format&fit=crop', cat: 'Mujer' },
      { name: 'Sudadera Lunar', desc: 'Sudadera gris oscura con capucha.', price: 34.99, img: 'https://images.unsplash.com/photo-1544441892-56bb85bfb9c5?q=80&w=1200&auto=format&fit=crop', cat: 'Niños' },
      { name: 'Zapatillas Grafito', desc: 'Zapatillas de lona color grafito.', price: 49.99, img: 'https://images.unsplash.com/photo-1521090285272-59c1d68e2b32?q=80&w=1200&auto=format&fit=crop', cat: 'Accesorios' }
    ];
    for (const it of items) {
      await run(db, 'INSERT INTO products (name, description, price, image_url, category_id) VALUES (?, ?, ?, ?, ?)', [
        it.name,
        it.desc,
        it.price,
        it.img,
        nameToId[it.cat]
      ]);
    }
  }
}

async function init() {
  const db = openDatabase();
  await createSchema(db);
  await seed(db);
}

async function listProducts() {
  const db = openDatabase();
  return all(db, `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC`);
}

async function getProduct(productId) {
  const db = openDatabase();
  return get(db, `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`, [productId]);
}

async function listProductsByCategoryName(categoryName, excludeId = null) {
  const db = openDatabase();
  const sqlBase = `SELECT p.* FROM products p INNER JOIN categories c ON p.category_id = c.id WHERE c.name = ?`;
  const params = [categoryName];
  const sql = excludeId ? `${sqlBase} AND p.id <> ?` : sqlBase;
  if (excludeId) params.push(excludeId);
  return all(db, `${sql} ORDER BY p.created_at DESC`, params);
}

async function createProduct({ name, description, price, image_url, category_name }) {
  const db = openDatabase();
  const cat = await get(db, 'SELECT id FROM categories WHERE name = ?', [category_name]);
  const categoryId = cat ? cat.id : (await run(db, 'INSERT INTO categories (name) VALUES (?)', [category_name])).lastID;
  const res = await run(db, 'INSERT INTO products (name, description, price, image_url, category_id) VALUES (?, ?, ?, ?, ?)', [name, description, price, image_url, categoryId]);
  return getProduct(res.lastID);
}

async function updateProduct(productId, { name, description, price, image_url, category_name }) {
  const db = openDatabase();
  const cat = await get(db, 'SELECT id FROM categories WHERE name = ?', [category_name]);
  const categoryId = cat ? cat.id : (await run(db, 'INSERT INTO categories (name) VALUES (?)', [category_name])).lastID;
  await run(db, 'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, category_id = ? WHERE id = ?', [name, description, price, image_url, categoryId, productId]);
  return getProduct(productId);
}

async function deleteProduct(productId) {
  const db = openDatabase();
  await run(db, 'DELETE FROM products WHERE id = ?', [productId]);
}

async function authenticate(username, password) {
  const db = openDatabase();
  const user = await get(db, 'SELECT * FROM users WHERE username = ?', [username]);
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.password_hash);
  return ok ? { id: user.id, username: user.username } : null;
}

exports.database = {
  init,
  listProducts,
  getProduct,
  listProductsByCategoryName,
  createProduct,
  updateProduct,
  deleteProduct,
  authenticate
};


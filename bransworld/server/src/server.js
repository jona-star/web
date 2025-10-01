const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cors = require('cors');

const { database } = require('./db');

const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(ROOT_DIR, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'devsecret-change-me';
const RECO_SERVICE_URL = process.env.RECO_SERVICE_URL || 'http://127.0.0.1:8000';

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: DATA_DIR }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
  })
);

app.use('/static', express.static(path.join(__dirname, 'public')));

app.locals.storeName = "Brans´World";
app.use((req, res, next) => {
  res.locals.storeName = app.locals.storeName;
  next();
});
app.locals.recoServiceUrl = RECO_SERVICE_URL;

app.use('/', webRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('pages/404', { title: 'Página no encontrada' });
});

database.init().then(() => {
  app.listen(PORT, () => {
    console.log(`Brans´World server escuchando en http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Error inicializando la base de datos:', err);
  process.exit(1);
});


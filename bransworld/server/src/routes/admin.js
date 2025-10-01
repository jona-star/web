const express = require('express');
const router = express.Router();
const { database } = require('../db');

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await database.authenticate(username, password);
    if (!user) {
      return res.status(401).render('pages/login', { title: 'Acceso Admin', error: 'Credenciales inválidas' });
    }
    req.session.user = user;
    res.redirect('/admin');
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const products = await database.listProducts();
    res.render('pages/admin/dashboard', { title: 'Panel', products, user: req.session.user });
  } catch (err) { next(err); }
});

router.get('/products/new', requireAuth, (req, res) => {
  res.render('pages/admin/product_form', { title: 'Crear producto', mode: 'create', product: {}, user: req.session.user });
});

router.post('/products', requireAuth, async (req, res, next) => {
  try {
    const { name, description, price, image_url, category_name } = req.body;
    await database.createProduct({ name, description, price: parseFloat(price), image_url, category_name });
    res.redirect('/admin');
  } catch (err) { next(err); }
});

router.get('/products/:id/edit', requireAuth, async (req, res, next) => {
  try {
    const product = await database.getProduct(req.params.id);
    if (!product) return res.redirect('/admin');
    res.render('pages/admin/product_form', { title: 'Editar producto', mode: 'edit', product, user: req.session.user });
  } catch (err) { next(err); }
});

router.put('/products/:id', requireAuth, async (req, res, next) => {
  try {
    const { name, description, price, image_url, category_name } = req.body;
    await database.updateProduct(req.params.id, { name, description, price: parseFloat(price), image_url, category_name });
    res.redirect('/admin');
  } catch (err) { next(err); }
});

router.delete('/products/:id', requireAuth, async (req, res, next) => {
  try {
    await database.deleteProduct(req.params.id);
    res.redirect('/admin');
  } catch (err) { next(err); }
});

module.exports = router;


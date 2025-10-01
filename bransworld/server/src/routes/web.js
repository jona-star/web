const express = require('express');
const router = express.Router();
const { database } = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const products = await database.listProducts();
    res.render('pages/home', { title: "Inicio", products, user: req.session.user });
  } catch (err) { next(err); }
});

router.get('/productos', async (req, res, next) => {
  try {
    const products = await database.listProducts();
    res.render('pages/products', { title: "Productos", products, user: req.session.user });
  } catch (err) { next(err); }
});

router.get('/producto/:id', async (req, res, next) => {
  try {
    const product = await database.getProduct(req.params.id);
    if (!product) return res.status(404).render('pages/404', { title: 'Producto no encontrado' });
    res.render('pages/product', { title: product.name, product, user: req.session.user });
  } catch (err) { next(err); }
});

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  res.render('pages/login', { title: 'Acceso Admin' });
});

module.exports = router;


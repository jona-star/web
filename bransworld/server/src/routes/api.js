const express = require('express');
const axios = require('axios');
const router = express.Router();
const { database } = require('../db');

router.get('/products', async (req, res, next) => {
  try {
    const products = await database.listProducts();
    res.json(products);
  } catch (err) { next(err); }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await database.getProduct(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (err) { next(err); }
});

router.get('/recommendations/:id', async (req, res, next) => {
  try {
    const product = await database.getProduct(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    const candidates = await database.listProductsByCategoryName(product.category_name, product.id);
    const candidateIds = candidates.map((p) => p.id);
    const recoServiceUrl = req.app.locals.recoServiceUrl;
    const url = `${recoServiceUrl}/recommend?category=${encodeURIComponent(product.category_name)}&exclude=${product.id}&candidates=${candidateIds.join(',')}`;
    const response = await axios.get(url, { timeout: 3000 });
    const ids = response.data && Array.isArray(response.data.ids) ? response.data.ids : [];
    const recommended = candidates.filter((p) => ids.includes(p.id)).slice(0, 6);
    res.json({ productId: product.id, recommended });
  } catch (err) {
    // fallback if reco service is unavailable
    try {
      const product = await database.getProduct(req.params.id);
      const fallback = await database.listProductsByCategoryName(product.category_name, product.id);
      res.json({ productId: product.id, recommended: fallback.slice(0, 6) });
    } catch (inner) {
      next(err);
    }
  }
});

module.exports = router;


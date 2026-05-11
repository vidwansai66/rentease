const express = require('express');
const { 
    getProducts, 
    getProductBySlug, 
    getAllCategories,
    globalSearch
} = require('../controllers/productController');

const router = express.Router();

router.get('/', getProducts);
router.get('/search', globalSearch);
router.get('/categories/all', getAllCategories);
router.get('/:slug', getProductBySlug);

module.exports = router;

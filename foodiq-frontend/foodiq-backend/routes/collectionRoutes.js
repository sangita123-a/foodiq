const express = require('express');
const router = express.Router();
const { ok, fail } = require('../utils/respond');
const { listCollections, getCollectionBySlug } = require('../models/collectionModel');

router.get('/', async (req, res) => {
  try {
    const rows = await listCollections({ limit: req.query.limit });
    return ok(res, 'Collections retrieved', rows);
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const row = await getCollectionBySlug(req.params.slug);
    if (!row) return fail(res, 404, 'Collection not found');
    return ok(res, 'Collection retrieved', row);
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
});

module.exports = router;

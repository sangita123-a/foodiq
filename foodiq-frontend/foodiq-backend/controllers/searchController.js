const { globalSearch } = require('../models/searchModel');

const search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search term "q" is required', error: {} });
    }

    const results = await globalSearch(q);
    res.json({ success: true, message: 'Search completed', data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { search };

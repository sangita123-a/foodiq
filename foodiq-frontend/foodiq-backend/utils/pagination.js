/**
 * Shared pagination + query helpers.
 */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const parsePagination = (query = {}, defaults = { page: 1, limit: 20, maxLimit: 100 }) => {
  const page = clamp(parseInt(query.page, 10) || defaults.page, 1, 100000);
  const limit = clamp(parseInt(query.limit, 10) || defaults.limit, 1, defaults.maxLimit);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const paginatedMeta = (total, page, limit) => ({
  total: Number(total) || 0,
  page,
  limit,
  totalPages: Math.max(1, Math.ceil((Number(total) || 0) / limit)),
});

module.exports = {
  parsePagination,
  paginatedMeta,
  clamp,
};

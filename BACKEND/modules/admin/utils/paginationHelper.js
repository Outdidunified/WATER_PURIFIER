const getPaginationParams = (req, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(req.body?.page || req.query?.page || 1));
  const limit = Math.min(
    Math.max(1, parseInt(req.body?.limit || req.query?.limit || defaultLimit)),
    maxLimit
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const formatPaginatedResponse = (data, total, page, limit) => {
  return {
    status: 'Success',
    data,
    pagination: {
      currentPage: page,
      pageSize: limit,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    }
  };
};

module.exports = {
  getPaginationParams,
  formatPaginatedResponse
};

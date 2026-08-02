const fail = (res, message) =>
  res.status(400).json({ success: false, message, error: { code: 'VALIDATION_ERROR' } });

const validateCreateTicket = (req, res, next) => {
  const { subject, description } = req.body || {};

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return fail(res, 'Subject is required.');
  }
  if (subject.trim().length < 3 || subject.trim().length > 150) {
    return fail(res, 'Subject must be between 3 and 150 characters.');
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    return fail(res, 'Description is required.');
  }
  if (description.trim().length < 10 || description.trim().length > 2000) {
    return fail(res, 'Description must be between 10 and 2000 characters.');
  }

  req.body.subject = subject.trim();
  req.body.description = description.trim();
  next();
};

const VALID_STATUSES = ['open', 'pending', 'resolved', 'closed'];

const validateAdminReply = (req, res, next) => {
  const { admin_reply, status } = req.body || {};

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return fail(res, `status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }
  if (admin_reply !== undefined && (typeof admin_reply !== 'string' || admin_reply.trim().length > 2000)) {
    return fail(res, 'admin_reply must be text under 2000 characters.');
  }
  if (!status && (!admin_reply || !String(admin_reply).trim())) {
    return fail(res, 'Provide admin_reply and/or status.');
  }

  next();
};

module.exports = {
  validateCreateTicket,
  validateAdminReply,
};

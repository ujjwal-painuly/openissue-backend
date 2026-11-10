import { AppError } from './AppError.js';

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parsePagination(pageValue = 1, limitValue = 10) {
  const page = Number(pageValue);
  const limit = Number(limitValue);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError('page must be a positive integer', 400);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new AppError('limit must be between 1 and 50', 400);
  }

  return { page, limit, skip: (page - 1) * limit };
}

export function buildIssueFilter(filters = {}) {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.assignee) query.assignee = filters.assignee;
  if (filters.label) query.labels = filters.label;

  if (filters.q?.trim()) {
    // Escape user input before building a regex so search text is treated literally.
    const safeSearch = escapeRegex(filters.q.trim());
    query.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { body: { $regex: safeSearch, $options: 'i' } }
    ];
  }

  return query;
}

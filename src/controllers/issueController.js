import { Issue } from '../models/Issue.js';
import { Repository } from '../models/Repository.js';
import { User } from '../models/User.js';
import { Comment } from '../models/Comment.js';
import { AppError } from '../utils/AppError.js';
import { buildIssueFilter, parsePagination } from '../utils/queryHelpers.js';
import { canAssignToRepository, canEditIssue, getIssueForUser } from '../services/issueAccess.js';
import { getRepositoryForUser } from '../services/repositoryAccess.js';

export async function createIssue(req, res) {
  const repository = await getRepositoryForUser(
    req.validated.params.repositoryId,
    req.user._id
  );
  const { assignee = null, ...issueFields } = req.validated.body;

  if (assignee) {
    const assigneeExists = await User.exists({ _id: assignee });
    if (!assigneeExists) throw new AppError('Assignee was not found', 404);
    if (!canAssignToRepository(repository, assignee)) {
      throw new AppError('Assignee must be the repository owner or a member', 400);
    }
  }

  // MongoDB increments this counter atomically, so two requests do not receive the same issue number.
  const updatedRepository = await Repository.findByIdAndUpdate(
    repository._id,
    { $inc: { nextIssueNumber: 1 } },
    { new: true, projection: { nextIssueNumber: 1 } }
  );

  const issue = await Issue.create({
    ...issueFields,
    repository: repository._id,
    issueNumber: updatedRepository.nextIssueNumber,
    author: req.user._id,
    assignee
  });

  await issue.populate([
    { path: 'author', select: 'name email' },
    { path: 'assignee', select: 'name email' }
  ]);

  return res.status(201).json({ status: 'success', data: { issue } });
}

export async function listIssues(req, res) {
  const { repositoryId } = req.validated.params;
  await getRepositoryForUser(repositoryId, req.user._id);

  const filters = req.validated.query;
  const { page, limit, skip } = parsePagination(filters.page, filters.limit);
  const query = {
    repository: repositoryId,
    ...buildIssueFilter(filters)
  };

  const sortBy = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'recently-updated': { updatedAt: -1 }
  }[filters.sort];

  const [issues, total] = await Promise.all([
    Issue.find(query)
      .populate('author', 'name email')
      .populate('assignee', 'name email')
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Issue.countDocuments(query)
  ]);

  return res.json({
    status: 'success',
    data: {
      issues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1
      }
    }
  });
}

export async function getIssue(req, res) {
  const { issue } = await getIssueForUser(req.validated.params.issueId, req.user._id);
  await issue.populate([
    { path: 'author', select: 'name email' },
    { path: 'assignee', select: 'name email' },
    { path: 'repository', select: 'name visibility owner' }
  ]);

  return res.json({ status: 'success', data: { issue } });
}

export async function updateIssue(req, res) {
  const { issue, repository } = await getIssueForUser(
    req.validated.params.issueId,
    req.user._id
  );

  if (!canEditIssue(issue, repository, req.user._id)) {
    throw new AppError('You do not have permission to edit this issue', 403);
  }

  const updates = req.validated.body;
  if (Object.hasOwn(updates, 'assignee') && updates.assignee) {
    const assigneeExists = await User.exists({ _id: updates.assignee });
    if (!assigneeExists) throw new AppError('Assignee was not found', 404);
    if (!canAssignToRepository(repository, updates.assignee)) {
      throw new AppError('Assignee must be the repository owner or a member', 400);
    }
  }

  Object.assign(issue, updates);
  await issue.save();
  await issue.populate([
    { path: 'author', select: 'name email' },
    { path: 'assignee', select: 'name email' }
  ]);

  return res.json({ status: 'success', data: { issue } });
}

export async function deleteIssue(req, res) {
  const { issue, repository } = await getIssueForUser(
    req.validated.params.issueId,
    req.user._id
  );

  const userCanDelete = repository.owner.equals(req.user._id)
    || repository.members.some((memberId) => memberId.equals(req.user._id));
  if (!userCanDelete) throw new AppError('Only repository maintainers can delete issues', 403);

  await Comment.deleteMany({ issue: issue._id });
  await issue.deleteOne();

  return res.status(204).send();
}

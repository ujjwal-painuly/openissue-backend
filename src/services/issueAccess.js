import mongoose from 'mongoose';
import { Issue } from '../models/Issue.js';
import { AppError } from '../utils/AppError.js';
import { getRepositoryForUser } from './repositoryAccess.js';

export async function getIssueForUser(issueId, userId) {
  if (!mongoose.isValidObjectId(issueId)) throw new AppError('Issue was not found', 404);

  const issue = await Issue.findById(issueId).populate('repository');
  if (!issue || !issue.repository) throw new AppError('Issue was not found', 404);

  const repository = await getRepositoryForUser(issue.repository._id, userId);
  return { issue, repository };
}

export function canEditIssue(issue, repository, userId) {
  const userIsOwner = repository.owner.equals(userId);
  const userIsMember = repository.members.some((memberId) => memberId.equals(userId));
  const userIsAuthor = issue.author.equals(userId);
  return userIsOwner || userIsMember || userIsAuthor;
}

export function canAssignToRepository(repository, userId) {
  return repository.owner.equals(userId) || repository.members.some((memberId) => memberId.equals(userId));
}

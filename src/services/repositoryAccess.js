import mongoose from 'mongoose';
import { Repository } from '../models/Repository.js';
import { AppError } from '../utils/AppError.js';

export function isRepositoryOwner(repository, userId) {
  return repository.owner.equals(userId);
}

export function isRepositoryMember(repository, userId) {
  return repository.members.some((memberId) => memberId.equals(userId));
}

export async function getRepositoryForUser(repositoryId, userId, { requireWrite = false } = {}) {
  if (!mongoose.isValidObjectId(repositoryId)) {
    throw new AppError('Repository was not found', 404);
  }

  const repository = await Repository.findById(repositoryId);
  if (!repository) throw new AppError('Repository was not found', 404);

  const owner = isRepositoryOwner(repository, userId);
  const member = isRepositoryMember(repository, userId);
  const canView = owner || member || repository.visibility === 'public';
  const canWrite = owner || member;

  // Return 404 for private repositories to avoid confirming their existence.
  if (!canView || (requireWrite && !canWrite)) {
    throw new AppError('Repository was not found', 404);
  }

  return repository;
}

export async function getRepositoryManager(repositoryId, userId) {
  const repository = await getRepositoryForUser(repositoryId, userId, { requireWrite: true });
  if (!isRepositoryOwner(repository, userId)) {
    throw new AppError('Only the repository owner can change repository settings', 403);
  }
  return repository;
}

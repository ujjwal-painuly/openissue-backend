import { Repository } from '../models/Repository.js';
import { User } from '../models/User.js';
import { Issue } from '../models/Issue.js';
import { Comment } from '../models/Comment.js';
import { AppError } from '../utils/AppError.js';
import { getRepositoryForUser, getRepositoryManager } from '../services/repositoryAccess.js';

export async function createRepository(req, res) {
  const repository = await Repository.create({
    ...req.validated.body,
    owner: req.user._id
  });

  return res.status(201).json({ status: 'success', data: { repository } });
}

export async function listMyRepositories(req, res) {
  const repositories = await Repository.find({
    $or: [{ owner: req.user._id }, { members: req.user._id }]
  })
    .populate('owner', 'name email')
    .sort({ updatedAt: -1 });

  return res.json({ status: 'success', results: repositories.length, data: { repositories } });
}

export async function getRepository(req, res) {
  const repository = await getRepositoryForUser(
    req.validated.params.repositoryId,
    req.user._id
  );

  await repository.populate([
    { path: 'owner', select: 'name email' },
    { path: 'members', select: 'name email' }
  ]);

  return res.json({ status: 'success', data: { repository } });
}

export async function updateRepository(req, res) {
  const repository = await getRepositoryManager(
    req.validated.params.repositoryId,
    req.user._id
  );

  Object.assign(repository, req.validated.body);
  await repository.save();

  return res.json({ status: 'success', data: { repository } });
}

export async function deleteRepository(req, res) {
  const repository = await getRepositoryManager(
    req.validated.params.repositoryId,
    req.user._id
  );

  const issues = await Issue.find({ repository: repository._id }).select('_id');
  const issueIds = issues.map((issue) => issue._id);

  await Comment.deleteMany({ issue: { $in: issueIds } });
  await Issue.deleteMany({ repository: repository._id });
  await repository.deleteOne();

  return res.status(204).send();
}

export async function addRepositoryMember(req, res) {
  const repository = await getRepositoryManager(
    req.validated.params.repositoryId,
    req.user._id
  );
  const { userId } = req.validated.body;

  const member = await User.findById(userId).select('name email');
  if (!member) throw new AppError('User to add was not found', 404);
  if (repository.owner.equals(member._id)) {
    throw new AppError('The repository owner is already a manager', 409);
  }

  if (!repository.members.some((id) => id.equals(member._id))) {
    repository.members.push(member._id);
    await repository.save();
  }

  return res.status(200).json({ status: 'success', data: { member } });
}

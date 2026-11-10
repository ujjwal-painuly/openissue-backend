import { Comment } from '../models/Comment.js';
import { AppError } from '../utils/AppError.js';
import { getIssueForUser } from '../services/issueAccess.js';

export async function listComments(req, res) {
  const { issue } = await getIssueForUser(req.validated.params.issueId, req.user._id);
  const comments = await Comment.find({ issue: issue._id })
    .populate('author', 'name email')
    .sort({ createdAt: 1 });

  return res.json({ status: 'success', results: comments.length, data: { comments } });
}

export async function createComment(req, res) {
  const { issue } = await getIssueForUser(req.validated.params.issueId, req.user._id);
  const comment = await Comment.create({
    issue: issue._id,
    author: req.user._id,
    body: req.validated.body.body
  });
  await comment.populate('author', 'name email');

  return res.status(201).json({ status: 'success', data: { comment } });
}

async function findCommentForEdit(req) {
  const { issue, repository } = await getIssueForUser(
    req.validated.params.issueId,
    req.user._id
  );
  const comment = await Comment.findOne({
    _id: req.validated.params.commentId,
    issue: issue._id
  });

  if (!comment) throw new AppError('Comment was not found', 404);

  const isAuthor = comment.author.equals(req.user._id);
  const isRepositoryOwner = repository.owner.equals(req.user._id);
  if (!isAuthor && !isRepositoryOwner) {
    throw new AppError('You can only change your own comments', 403);
  }

  return comment;
}

export async function updateComment(req, res) {
  const comment = await findCommentForEdit(req);
  comment.body = req.validated.body.body;
  await comment.save();
  await comment.populate('author', 'name email');

  return res.json({ status: 'success', data: { comment } });
}

export async function deleteComment(req, res) {
  const comment = await findCommentForEdit(req);
  await comment.deleteOne();
  return res.status(204).send();
}

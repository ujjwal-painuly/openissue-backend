import { Router } from 'express';
import {
  getIssue,
  updateIssue,
  deleteIssue
} from '../controllers/issueController.js';
import { listComments, createComment, updateComment, deleteComment } from '../controllers/commentController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { issueIdSchema, updateIssueSchema } from '../validators/issueValidators.js';
import { commentIdSchema, createCommentSchema, updateCommentSchema } from '../validators/commentValidators.js';

const router = Router();
router.use(authenticate);

router.route('/:issueId')
  .get(validate(issueIdSchema), asyncHandler(getIssue))
  .patch(validate(updateIssueSchema), asyncHandler(updateIssue))
  .delete(validate(issueIdSchema), asyncHandler(deleteIssue));

router.get('/:issueId/comments', validate(issueIdSchema), asyncHandler(listComments));
router.post('/:issueId/comments', validate(createCommentSchema), asyncHandler(createComment));
router.patch('/:issueId/comments/:commentId', validate(updateCommentSchema), asyncHandler(updateComment));
router.delete('/:issueId/comments/:commentId', validate(commentIdSchema), asyncHandler(deleteComment));

export default router;

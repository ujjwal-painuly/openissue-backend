import { Router } from 'express';
import {
  createRepository,
  listMyRepositories,
  getRepository,
  updateRepository,
  deleteRepository,
  addRepositoryMember
} from '../controllers/repositoryController.js';
import { createIssue, listIssues } from '../controllers/issueController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createRepositorySchema, repositoryIdSchema, updateRepositorySchema } from '../validators/repositoryValidators.js';
import { createIssueSchema, listIssuesSchema } from '../validators/issueValidators.js';
import { z } from 'zod';

const router = Router();
const addMemberSchema = z.object({
  body: z.object({ userId: z.string().regex(/^[a-f\d]{24}$/i) }),
  params: z.object({ repositoryId: z.string().regex(/^[a-f\d]{24}$/i) }),
  query: z.object({})
});

router.use(authenticate);
router.route('/')
  .get(asyncHandler(listMyRepositories))
  .post(validate(createRepositorySchema), asyncHandler(createRepository));

router.post('/:repositoryId/members', validate(addMemberSchema), asyncHandler(addRepositoryMember));
router.route('/:repositoryId/issues')
  .get(validate(listIssuesSchema), asyncHandler(listIssues))
  .post(validate(createIssueSchema), asyncHandler(createIssue));

router.route('/:repositoryId')
  .get(validate(repositoryIdSchema), asyncHandler(getRepository))
  .patch(validate(updateRepositorySchema), asyncHandler(updateRepository))
  .delete(validate(repositoryIdSchema), asyncHandler(deleteRepository));

export default router;

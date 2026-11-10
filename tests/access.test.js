import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRepositoryOwner,
  isRepositoryMember
} from '../src/services/repositoryAccess.js';
import {
  canAssignToRepository,
  canEditIssue
} from '../src/services/issueAccess.js';

const id = (value) => ({
  value,
  equals(other) {
    return this.value === (other?.value ?? other);
  }
});

test('repository ownership and membership checks use ObjectId-like equality', () => {
  const owner = id('owner');
  const member = id('member');
  const repository = { owner, members: [member] };

  assert.equal(isRepositoryOwner(repository, id('owner')), true);
  assert.equal(isRepositoryOwner(repository, id('someone-else')), false);
  assert.equal(isRepositoryMember(repository, id('member')), true);
  assert.equal(isRepositoryMember(repository, id('outsider')), false);
});

test('only repository owners and members can be assigned to an issue', () => {
  const repository = { owner: id('owner'), members: [id('member')] };

  assert.equal(canAssignToRepository(repository, id('owner')), true);
  assert.equal(canAssignToRepository(repository, id('member')), true);
  assert.equal(canAssignToRepository(repository, id('outsider')), false);
});

test('issue edit permission is granted to owner, member, or issue author', () => {
  const repository = { owner: id('owner'), members: [id('member')] };
  const issue = { author: id('author') };

  assert.equal(canEditIssue(issue, repository, id('owner')), true);
  assert.equal(canEditIssue(issue, repository, id('member')), true);
  assert.equal(canEditIssue(issue, repository, id('author')), true);
  assert.equal(canEditIssue(issue, repository, id('outsider')), false);
});

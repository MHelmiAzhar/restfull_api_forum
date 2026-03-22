import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import pool from '../../database/postgres/pool.js';
import CommentRepositoryPostgres from '../CommentRepositoryPostgres.js';

describe('CommentRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should persist add comment', async () => {
    const fakeIdGenerator = () => '123';
    const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

    await commentRepository.addComment({
      content: 'sebuah komentar',
      threadId: 'thread-123',
      owner: 'user-123',
    });

    const comments = await CommentsTableTestHelper.findCommentById('comment-123');
    expect(comments).toHaveLength(1);
  });

  it('should throw NotFoundError when comment not found in thread', async () => {
    const commentRepository = new CommentRepositoryPostgres(pool, {});

    await expect(commentRepository.verifyCommentOnThread('comment-404', 'thread-123'))
      .rejects
      .toThrow(NotFoundError);
  });

  it('should throw AuthorizationError when owner is not valid', async () => {
    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      threadId: 'thread-123',
      owner: 'user-123',
    });

    const commentRepository = new CommentRepositoryPostgres(pool, {});

    await expect(commentRepository.verifyCommentOwner('comment-123', 'user-999'))
      .rejects
      .toThrow(AuthorizationError);
  });

  it('should soft delete comment', async () => {
    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      threadId: 'thread-123',
      owner: 'user-123',
      isDelete: false,
    });

    const commentRepository = new CommentRepositoryPostgres(pool, {});
    await commentRepository.deleteCommentById('comment-123');

    const comments = await CommentsTableTestHelper.findCommentById('comment-123');
    expect(comments[0].isDelete).toEqual(true);
  });

  it('should map deleted comment content on detail result', async () => {
    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      threadId: 'thread-123',
      owner: 'user-123',
      isDelete: true,
    });

    const commentRepository = new CommentRepositoryPostgres(pool, {});
    const comments = await commentRepository.getCommentsByThreadId('thread-123');

    expect(comments[0].content).toEqual('**komentar telah dihapus**');
  });
});

import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import CommentLikesTableTestHelper from '../../../../tests/CommentLikesTableTestHelper.js';
import pool from '../../database/postgres/pool.js';
import CommentRepositoryPostgres from '../CommentRepositoryPostgres.js';

describe('CommentRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
  });

  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
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
    expect(comments[0].likeCount).toEqual(0);
  });

  it('should show likeCount on get comments by thread id result', async () => {
    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      threadId: 'thread-123',
      owner: 'user-123',
    });

    await CommentLikesTableTestHelper.addLike({
      id: 'comment-like-123',
      commentId: 'comment-123',
      owner: 'user-123',
    });

    const commentRepository = new CommentRepositoryPostgres(pool, {});
    const comments = await commentRepository.getCommentsByThreadId('thread-123');

    expect(comments[0].likeCount).toEqual(1);
  });

  it('should return false when comment has not been liked by user', async () => {
    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      threadId: 'thread-123',
      owner: 'user-123',
    });

    const commentRepository = new CommentRepositoryPostgres(pool, {});
    const isLiked = await commentRepository.isCommentLikedByUser('comment-123', 'user-123');

    expect(isLiked).toEqual(false);
  });

  it('should return true when comment has been liked by user', async () => {
    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      threadId: 'thread-123',
      owner: 'user-123',
    });
    await CommentLikesTableTestHelper.addLike({
      id: 'comment-like-123',
      commentId: 'comment-123',
      owner: 'user-123',
    });

    const commentRepository = new CommentRepositoryPostgres(pool, {});
    const isLiked = await commentRepository.isCommentLikedByUser('comment-123', 'user-123');

    expect(isLiked).toEqual(true);
  });

  it('should persist comment like', async () => {
    const fakeIdGenerator = () => '123';
    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      threadId: 'thread-123',
      owner: 'user-123',
    });

    const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);
    await commentRepository.likeComment('comment-123', 'user-123');

    const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndOwner('comment-123', 'user-123');
    expect(likes).toHaveLength(1);
  });

  it('should remove comment like', async () => {
    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      threadId: 'thread-123',
      owner: 'user-123',
    });
    await CommentLikesTableTestHelper.addLike({
      id: 'comment-like-123',
      commentId: 'comment-123',
      owner: 'user-123',
    });

    const commentRepository = new CommentRepositoryPostgres(pool, {});
    await commentRepository.unlikeComment('comment-123', 'user-123');

    const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndOwner('comment-123', 'user-123');
    expect(likes).toHaveLength(0);
  });
});

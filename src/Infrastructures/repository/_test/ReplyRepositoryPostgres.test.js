import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import pool from '../../database/postgres/pool.js';
import ReplyRepositoryPostgres from '../ReplyRepositoryPostgres.js';

describe('ReplyRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should persist add reply', async () => {
    const fakeIdGenerator = () => '123';
    const replyRepository = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

    await replyRepository.addReply({
      content: 'sebuah balasan',
      commentId: 'comment-123',
      owner: 'user-123',
    });

    const replies = await RepliesTableTestHelper.findReplyById('reply-123');
    expect(replies).toHaveLength(1);
  });

  it('should throw NotFoundError when reply not found on comment', async () => {
    const replyRepository = new ReplyRepositoryPostgres(pool, {});

    await expect(replyRepository.verifyReplyOnComment('reply-404', 'comment-123'))
      .rejects
      .toThrow(NotFoundError);
  });

  it('should throw AuthorizationError when owner is not valid', async () => {
    await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: 'user-123' });

    const replyRepository = new ReplyRepositoryPostgres(pool, {});

    await expect(replyRepository.verifyReplyOwner('reply-123', 'user-999'))
      .rejects
      .toThrow(AuthorizationError);
  });

  it('should soft delete reply', async () => {
    await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: 'user-123' });

    const replyRepository = new ReplyRepositoryPostgres(pool, {});
    await replyRepository.deleteReplyById('reply-123');

    const replies = await RepliesTableTestHelper.findReplyById('reply-123');
    expect(replies[0].isDelete).toEqual(true);
  });

  it('should map deleted reply content on detail result', async () => {
    await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: 'user-123', isDelete: true });

    const replyRepository = new ReplyRepositoryPostgres(pool, {});
    const replies = await replyRepository.getRepliesByCommentIds(['comment-123']);

    expect(replies[0].content).toEqual('**balasan telah dihapus**');
  });
});

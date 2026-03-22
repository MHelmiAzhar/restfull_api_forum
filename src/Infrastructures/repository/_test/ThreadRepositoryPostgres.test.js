import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import pool from '../../database/postgres/pool.js';
import ThreadRepositoryPostgres from '../ThreadRepositoryPostgres.js';

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should persist new thread', async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123' });
    const fakeIdGenerator = () => '123';
    const threadRepository = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

    await threadRepository.addThread({
      title: 'sebuah thread',
      body: 'sebuah body thread',
      owner: 'user-123',
    });

    const threads = await ThreadsTableTestHelper.findThreadById('thread-123');
    expect(threads).toHaveLength(1);
  });

  it('should throw NotFoundError when verify thread not found', async () => {
    const threadRepository = new ThreadRepositoryPostgres(pool, {});

    await expect(threadRepository.verifyThreadAvailability('thread-404'))
      .rejects
      .toThrow(NotFoundError);
  });

  it('should get thread detail correctly', async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

    const threadRepository = new ThreadRepositoryPostgres(pool, {});
    const thread = await threadRepository.getThreadById('thread-123');

    expect(thread.id).toEqual('thread-123');
    expect(thread.username).toEqual('dicoding');
  });
});

import { vi } from 'vitest';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ReplyRepository from '../../../Domains/replies/ReplyRepository.js';
import GetThreadDetailUseCase from '../GetThreadDetailUseCase.js';

describe('GetThreadDetailUseCase', () => {
  it('should orchestrating get thread detail action correctly', async () => {
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.getThreadById = vi.fn().mockImplementation(() => Promise.resolve({
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2026-03-22T00:00:00.000Z',
      username: 'dicoding',
    }));

    mockCommentRepository.getCommentsByThreadId = vi.fn().mockImplementation(() => Promise.resolve([
      {
        id: 'comment-123',
        username: 'dicoding',
        date: '2026-03-22T00:00:00.000Z',
        content: 'sebuah komentar',
      },
    ]));

    mockReplyRepository.getRepliesByCommentIds = vi.fn().mockImplementation(() => Promise.resolve([
      {
        id: 'reply-123',
        commentId: 'comment-123',
        content: 'sebuah balasan',
        date: '2026-03-22T00:00:00.000Z',
        username: 'johndoe',
      },
    ]));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    const thread = await getThreadDetailUseCase.execute('thread-123');

    expect(mockThreadRepository.getThreadById).toBeCalledWith('thread-123');
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith('thread-123');
    expect(mockReplyRepository.getRepliesByCommentIds).toBeCalledWith(['comment-123']);

    expect(thread.comments[0].replies).toHaveLength(1);
    expect(thread.comments[0].replies[0].id).toEqual('reply-123');
  });
});

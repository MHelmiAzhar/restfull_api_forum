import { vi } from 'vitest';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ToggleCommentLikeUseCase from '../ToggleCommentLikeUseCase.js';

describe('ToggleCommentLikeUseCase', () => {
  it('should orchestrating like comment action correctly when comment has not been liked', async () => {
    const useCaseParams = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyThreadAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentOnThread = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.isCommentLikedByUser = vi.fn().mockImplementation(() => Promise.resolve(false));
    mockCommentRepository.likeComment = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.unlikeComment = vi.fn().mockImplementation(() => Promise.resolve());

    const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    await toggleCommentLikeUseCase.execute(useCaseParams);

    expect(mockThreadRepository.verifyThreadAvailability).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentOnThread).toBeCalledWith('comment-123', 'thread-123');
    expect(mockCommentRepository.isCommentLikedByUser).toBeCalledWith('comment-123', 'user-123');
    expect(mockCommentRepository.likeComment).toBeCalledWith('comment-123', 'user-123');
    expect(mockCommentRepository.unlikeComment).not.toBeCalled();
  });

  it('should orchestrating unlike comment action correctly when comment has been liked', async () => {
    const useCaseParams = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyThreadAvailability = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentOnThread = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.isCommentLikedByUser = vi.fn().mockImplementation(() => Promise.resolve(true));
    mockCommentRepository.likeComment = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.unlikeComment = vi.fn().mockImplementation(() => Promise.resolve());

    const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    await toggleCommentLikeUseCase.execute(useCaseParams);

    expect(mockThreadRepository.verifyThreadAvailability).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentOnThread).toBeCalledWith('comment-123', 'thread-123');
    expect(mockCommentRepository.isCommentLikedByUser).toBeCalledWith('comment-123', 'user-123');
    expect(mockCommentRepository.unlikeComment).toBeCalledWith('comment-123', 'user-123');
    expect(mockCommentRepository.likeComment).not.toBeCalled();
  });
});

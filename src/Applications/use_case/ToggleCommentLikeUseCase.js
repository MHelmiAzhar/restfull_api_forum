class ToggleCommentLikeUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCaseParams) {
    const { threadId, commentId, owner } = useCaseParams;

    await this._threadRepository.verifyThreadAvailability(threadId);
    await this._commentRepository.verifyCommentOnThread(commentId, threadId);

    const isLiked = await this._commentRepository.isCommentLikedByUser(commentId, owner);

    if (isLiked) {
      await this._commentRepository.unlikeComment(commentId, owner);
      return;
    }

    await this._commentRepository.likeComment(commentId, owner);
  }
}

export default ToggleCommentLikeUseCase;

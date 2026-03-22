class DeleteCommentUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCaseParams) {
    const { threadId, commentId, owner } = useCaseParams;

    await this._threadRepository.verifyThreadAvailability(threadId);
    await this._commentRepository.verifyCommentOnThread(commentId, threadId);
    await this._commentRepository.verifyCommentOwner(commentId, owner);
    await this._commentRepository.deleteCommentById(commentId);
  }
}

export default DeleteCommentUseCase;

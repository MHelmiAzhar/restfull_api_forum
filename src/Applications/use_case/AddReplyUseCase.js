import NewReply from '../../Domains/replies/entities/NewReply.js';

class AddReplyUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(useCasePayload, useCaseParams) {
    const { threadId, commentId, owner } = useCaseParams;

    await this._threadRepository.verifyThreadAvailability(threadId);
    await this._commentRepository.verifyCommentOnThread(commentId, threadId);

    const newReply = new NewReply({
      ...useCasePayload,
      commentId,
      owner,
    });

    return this._replyRepository.addReply(newReply);
  }
}

export default AddReplyUseCase;

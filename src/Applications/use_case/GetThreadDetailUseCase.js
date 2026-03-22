class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId) {
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);

    if (!comments.length) {
      return {
        ...thread,
        comments: [],
      };
    }

    const commentIds = comments.map((comment) => comment.id);
    const replies = await this._replyRepository.getRepliesByCommentIds(commentIds);

    const repliesByCommentId = replies.reduce((result, reply) => {
      if (!result[reply.commentId]) {
        result[reply.commentId] = [];
      }

      result[reply.commentId].push({
        id: reply.id,
        content: reply.content,
        date: reply.date,
        username: reply.username,
      });

      return result;
    }, {});

    const commentsWithReplies = comments.map((comment) => ({
      ...comment,
      replies: repliesByCommentId[comment.id] || [],
    }));

    return {
      ...thread,
      comments: commentsWithReplies,
    };
  }
}

export default GetThreadDetailUseCase;

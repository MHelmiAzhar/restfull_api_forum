import express from 'express';
import authentication from '../../middleware/authentication.js';

const createThreadsRouter = (handler) => {
  const router = express.Router();

  router.post('/', authentication, handler.postThreadHandler);
  router.get('/:threadId', handler.getThreadByIdHandler);
  router.post('/:threadId/comments', authentication, handler.postCommentHandler);
  router.delete('/:threadId/comments/:commentId', authentication, handler.deleteCommentHandler);
  router.put('/:threadId/comments/:commentId/likes', authentication, handler.putCommentLikeHandler);

  router.post('/:threadId/comments/:commentId/replies', authentication, handler.postReplyHandler);
  router.delete('/:threadId/comments/:commentId/replies/:replyId', authentication, handler.deleteReplyHandler);

  return router;
};

export default createThreadsRouter;

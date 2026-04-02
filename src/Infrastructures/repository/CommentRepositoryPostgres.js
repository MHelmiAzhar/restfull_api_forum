import AuthorizationError from '../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../Commons/exceptions/NotFoundError.js';
import CommentRepository from '../../Domains/comments/CommentRepository.js';
import AddedComment from '../../Domains/comments/entities/AddedComment.js';

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(newComment) {
    const { content, threadId, owner } = newComment;
    const id = `comment-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO comments(id, "threadId", content, owner) VALUES($1, $2, $3, $4) RETURNING id, content, owner',
      values: [id, threadId, content, owner],
    };

    const result = await this._pool.query(query);

    return new AddedComment(result.rows[0]);
  }

  async verifyCommentOnThread(commentId, threadId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1 AND "threadId" = $2',
      values: [commentId, threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('komentar tidak ditemukan');
    }
  }

  async verifyCommentOwner(commentId, owner) {
    const query = {
      text: 'SELECT owner FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('komentar tidak ditemukan');
    }

    if (result.rows[0].owner !== owner) {
      throw new AuthorizationError('anda tidak berhak mengakses resource ini');
    }
  }

  async deleteCommentById(commentId) {
    const query = {
      text: 'UPDATE comments SET "isDelete" = true WHERE id = $1',
      values: [commentId],
    };

    await this._pool.query(query);
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: `
        SELECT c.id, u.username, c."createdAt" AS date,
        CASE
          WHEN c."isDelete" = true THEN '**komentar telah dihapus**'
          ELSE c.content
        END AS content,
        COALESCE(cl."likeCount", 0)::integer AS "likeCount"
        FROM comments c
        JOIN users u ON u.id = c.owner
        LEFT JOIN (
          SELECT "commentId", COUNT(*) AS "likeCount"
          FROM comment_likes
          GROUP BY "commentId"
        ) cl ON cl."commentId" = c.id
        WHERE c."threadId" = $1
        ORDER BY c."createdAt" ASC
      `,
      values: [threadId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async isCommentLikedByUser(commentId, owner) {
    const query = {
      text: 'SELECT id FROM comment_likes WHERE "commentId" = $1 AND owner = $2',
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);
    return Boolean(result.rowCount);
  }

  async likeComment(commentId, owner) {
    const id = `comment-like-${this._idGenerator()}`;
    const query = {
      text: 'INSERT INTO comment_likes(id, "commentId", owner) VALUES($1, $2, $3)',
      values: [id, commentId, owner],
    };

    await this._pool.query(query);
  }

  async unlikeComment(commentId, owner) {
    const query = {
      text: 'DELETE FROM comment_likes WHERE "commentId" = $1 AND owner = $2',
      values: [commentId, owner],
    };

    await this._pool.query(query);
  }
}

export default CommentRepositoryPostgres;

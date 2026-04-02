import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import CommentLikesTableTestHelper from '../../../../tests/CommentLikesTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';
import AuthenticationTokenManager from '../../../Applications/security/AuthenticationTokenManager.js';

describe('HTTP server', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  it('should response 404 when request unregistered route', async () => {
    // Arrange
    const app = await createServer({});

    // Action
    const response = await request(app).get('/unregisteredRoute');

    // Assert
    expect(response.status).toEqual(404);
  });

  describe('when POST /users', () => {
    it('should response 201 and persisted user', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedUser).toBeDefined();
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const requestPayload = {
        fullname: 'Dicoding Indonesia',
        password: 'secret',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
        fullname: ['Dicoding Indonesia'],
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena tipe data tidak sesuai');
    });

    it('should response 400 when username more than 50 character', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicodingindonesiadicodingindonesiadicodingindonesiadicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena karakter username melebihi batas limit');
    });

    it('should response 400 when username contain restricted character', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicoding indonesia',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena username mengandung karakter terlarang');
    });

    it('should response 400 when username unavailable', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'dicoding' });
      const requestPayload = {
        username: 'dicoding',
        fullname: 'Dicoding Indonesia',
        password: 'super_secret',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username tidak tersedia');
    });
  });

  describe('when POST /authentications', () => {
    it('should response 201 and new authentication', async () => {
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
      };
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should response 400 if username not found', async () => {
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
      };
      const app = await createServer(container);

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username tidak ditemukan');
    });

    it('should response 401 if password wrong', async () => {
      const requestPayload = {
        username: 'dicoding',
        password: 'wrong_password',
      };
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('kredensial yang Anda masukkan salah');
    });

    it('should response 400 if login payload not contain needed property', async () => {
      const requestPayload = {
        username: 'dicoding',
      };
      const app = await createServer(container);

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('harus mengirimkan username dan password');
    });

    it('should response 400 if login payload wrong data type', async () => {
      const requestPayload = {
        username: 123,
        password: 'secret',
      };
      const app = await createServer(container);

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username dan password harus string');
    });
  });

  describe('when PUT /authentications', () => {
    it('should return 200 and new access token', async () => {
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      const { refreshToken } = loginResponse.body.data;
      const response = await request(app).put('/authentications').send({ refreshToken });

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return 400 payload not contain refresh token', async () => {
      const app = await createServer(container);

      const response = await request(app).put('/authentications').send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('harus mengirimkan token refresh');
    });

    it('should return 400 if refresh token not string', async () => {
      const app = await createServer(container);

      const response = await request(app).put('/authentications').send({ refreshToken: 123 });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token harus string');
    });

    it('should return 400 if refresh token not valid', async () => {
      const app = await createServer(container);

      const response = await request(app).put('/authentications').send({ refreshToken: 'invalid_refresh_token' });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token tidak valid');
    });

    it('should return 400 if refresh token not registered in database', async () => {
      const app = await createServer(container);
      const refreshToken = await container.getInstance(AuthenticationTokenManager.name).createRefreshToken({ username: 'dicoding' });

      const response = await request(app).put('/authentications').send({ refreshToken });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token tidak ditemukan di database');
    });
  });

  describe('when DELETE /authentications', () => {
    it('should response 200 if refresh token valid', async () => {
      const app = await createServer(container);
      const refreshToken = 'refresh_token';
      await AuthenticationsTableTestHelper.addToken(refreshToken);

      const response = await request(app).delete('/authentications').send({ refreshToken });

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 400 if refresh token not registered in database', async () => {
      const app = await createServer(container);
      const refreshToken = 'refresh_token';

      const response = await request(app).delete('/authentications').send({ refreshToken });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token tidak ditemukan di database');
    });

    it('should response 400 if payload not contain refresh token', async () => {
      const app = await createServer(container);

      const response = await request(app).delete('/authentications').send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('harus mengirimkan token refresh');
    });
  });

  describe('when POST /threads', () => {
    it('should response 201 and persisted thread', async () => {
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      const { accessToken } = loginResponse.body.data;

      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'sebuah thread',
          body: 'sebuah body thread',
        });

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedThread.id).toBeDefined();
      expect(response.body.data.addedThread.title).toEqual('sebuah thread');
      expect(response.body.data.addedThread.owner).toBeDefined();
    });

    it('should response 400 when payload invalid', async () => {
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      const { accessToken } = loginResponse.body.data;

      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'sebuah thread',
        });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeTruthy();
    });
  });

  describe('comments and replies flow', () => {
    it('should add and delete comment correctly', async () => {
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      const { accessToken } = loginResponse.body.data;

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'sebuah thread',
          body: 'sebuah body thread',
        });

      const threadId = threadResponse.body.data.addedThread.id;

      const addCommentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'sebuah komentar',
        });

      expect(addCommentResponse.status).toEqual(201);
      expect(addCommentResponse.body.data.addedComment.id).toBeDefined();

      const commentId = addCommentResponse.body.data.addedComment.id;

      const deleteCommentResponse = await request(app)
        .delete(`/threads/${threadId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteCommentResponse.status).toEqual(200);
      expect(deleteCommentResponse.body.status).toEqual('success');
    });

    it('should response 404 when add comment to unavailable thread', async () => {
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      const { accessToken } = loginResponse.body.data;

      const response = await request(app)
        .post('/threads/thread-404/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah komentar' });

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 403 when delete comment by non owner', async () => {
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });
      await request(app).post('/users').send({
        username: 'johndoe',
        password: 'secret',
        fullname: 'John Doe',
      });

      const loginDicoding = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });
      const loginJohn = await request(app).post('/authentications').send({
        username: 'johndoe',
        password: 'secret',
      });

      const tokenDicoding = loginDicoding.body.data.accessToken;
      const tokenJohn = loginJohn.body.data.accessToken;

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${tokenDicoding}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      const threadId = threadResponse.body.data.addedThread.id;
      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${tokenDicoding}`)
        .send({ content: 'sebuah komentar' });

      const commentId = commentResponse.body.data.addedComment.id;

      const deleteResponse = await request(app)
        .delete(`/threads/${threadId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${tokenJohn}`);

      expect(deleteResponse.status).toEqual(403);
      expect(deleteResponse.body.status).toEqual('fail');
    });

    it('should response 201 when add reply and response 200 when delete reply', async () => {
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      const { accessToken } = loginResponse.body.data;

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const threadId = threadResponse.body.data.addedThread.id;

      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah komentar' });
      const commentId = commentResponse.body.data.addedComment.id;

      const addReplyResponse = await request(app)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      expect(addReplyResponse.status).toEqual(201);
      expect(addReplyResponse.body.data.addedReply.id).toBeDefined();

      const replyId = addReplyResponse.body.data.addedReply.id;

      const deleteReplyResponse = await request(app)
        .delete(`/threads/${threadId}/comments/${commentId}/replies/${replyId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteReplyResponse.status).toEqual(200);
      expect(deleteReplyResponse.body.status).toEqual('success');
    });

    it('should toggle like and unlike comment correctly', async () => {
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      const { accessToken } = loginResponse.body.data;

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const threadId = threadResponse.body.data.addedThread.id;

      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah komentar' });
      const commentId = commentResponse.body.data.addedComment.id;

      const firstLikeResponse = await request(app)
        .put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(firstLikeResponse.status).toEqual(200);
      expect(firstLikeResponse.body.status).toEqual('success');

      const secondLikeResponse = await request(app)
        .put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(secondLikeResponse.status).toEqual(200);
      expect(secondLikeResponse.body.status).toEqual('success');
    });

    it('should response 401 when toggle like without access token', async () => {
      const app = await createServer(container);

      const response = await request(app)
        .put('/threads/thread-123/comments/comment-123/likes');

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when GET /threads/:threadId', () => {
    it('should response 200 and return thread detail with comments and replies', async () => {
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });
      await request(app).post('/users').send({
        username: 'johndoe',
        password: 'secret',
        fullname: 'John Doe',
      });

      const loginDicoding = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });
      const loginJohn = await request(app).post('/authentications').send({
        username: 'johndoe',
        password: 'secret',
      });

      const tokenDicoding = loginDicoding.body.data.accessToken;
      const tokenJohn = loginJohn.body.data.accessToken;

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${tokenDicoding}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const threadId = threadResponse.body.data.addedThread.id;

      const comment1Response = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${tokenDicoding}`)
        .send({ content: 'komentar pertama' });
      const comment2Response = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${tokenJohn}`)
        .send({ content: 'komentar kedua' });

      const comment2Id = comment2Response.body.data.addedComment.id;

      await request(app)
        .delete(`/threads/${threadId}/comments/${comment2Id}`)
        .set('Authorization', `Bearer ${tokenJohn}`);

      const comment1Id = comment1Response.body.data.addedComment.id;
      const reply1Response = await request(app)
        .post(`/threads/${threadId}/comments/${comment1Id}/replies`)
        .set('Authorization', `Bearer ${tokenJohn}`)
        .send({ content: 'balasan pertama' });
      const reply1Id = reply1Response.body.data.addedReply.id;

      await request(app)
        .delete(`/threads/${threadId}/comments/${comment1Id}/replies/${reply1Id}`)
        .set('Authorization', `Bearer ${tokenJohn}`);

      const response = await request(app).get(`/threads/${threadId}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.thread.id).toEqual(threadId);
      expect(response.body.data.thread.comments).toHaveLength(2);
      expect(response.body.data.thread.comments[1].content).toEqual('**komentar telah dihapus**');
      expect(response.body.data.thread.comments[0].replies[0].content).toEqual('**balasan telah dihapus**');
      expect(response.body.data.thread.comments[0].likeCount).toEqual(0);
      expect(response.body.data.thread.comments[1].likeCount).toEqual(0);
    });

    it('should response thread detail with likeCount on comments', async () => {
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });
      await request(app).post('/users').send({
        username: 'johndoe',
        password: 'secret',
        fullname: 'John Doe',
      });

      const loginDicoding = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });
      const loginJohn = await request(app).post('/authentications').send({
        username: 'johndoe',
        password: 'secret',
      });

      const tokenDicoding = loginDicoding.body.data.accessToken;
      const tokenJohn = loginJohn.body.data.accessToken;

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${tokenDicoding}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const threadId = threadResponse.body.data.addedThread.id;

      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${tokenDicoding}`)
        .send({ content: 'komentar pertama' });
      const commentId = commentResponse.body.data.addedComment.id;

      await request(app)
        .put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${tokenDicoding}`);
      await request(app)
        .put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${tokenJohn}`);

      const response = await request(app).get(`/threads/${threadId}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.thread.comments[0].likeCount).toEqual(2);
    });

    it('should response 404 when thread not found', async () => {
      const app = await createServer(container);
      const response = await request(app).get('/threads/thread-404');

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeTruthy();
    });
  });

  it('should handle server error correctly', async () => {
    // Arrange
    const requestPayload = {
      username: 'dicoding',
      fullname: 'Dicoding Indonesia',
      password: 'super_secret',
    };
    const app = await createServer({});

    // Action
    const response = await request(app).post('/users').send(requestPayload);

    // Assert
    expect(response.status).toEqual(500);
    expect(response.body.status).toEqual('error');
    expect(response.body.message).toEqual('terjadi kegagalan pada server kami');
  });
});

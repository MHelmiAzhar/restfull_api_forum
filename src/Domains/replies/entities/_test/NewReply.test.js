import NewReply from '../NewReply.js';

describe('NewReply entity', () => {
  it('should throw error when payload does not contain needed property', () => {
    const payload = {
      content: 'balasan',
    };

    expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload does not meet data type specification', () => {
    const payload = {
      content: 'balasan',
      commentId: 'comment-123',
      owner: 123,
    };

    expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewReply object correctly', () => {
    const payload = {
      content: 'balasan',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const newReply = new NewReply(payload);

    expect(newReply.content).toEqual(payload.content);
    expect(newReply.commentId).toEqual(payload.commentId);
    expect(newReply.owner).toEqual(payload.owner);
  });
});

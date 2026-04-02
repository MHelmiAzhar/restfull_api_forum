export const up = (pgm) => {
  pgm.createTable('comment_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    commentId: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'comments(id)',
      onDelete: 'CASCADE',
    },
    owner: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint('comment_likes', 'comment_likes_unique_comment_id_and_owner', {
    unique: ['commentId', 'owner'],
  });
};

export const down = (pgm) => {
  pgm.dropTable('comment_likes');
};

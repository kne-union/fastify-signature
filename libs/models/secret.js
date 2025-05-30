module.exports = ({ DataTypes, options }) => {
  return {
    model: {
      secretKey: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '密钥'
      },
      description: {
        type: DataTypes.STRING,
        comment: '描述'
      },
      lastVisitedAt: {
        type: DataTypes.DATE,
        comment: '最后访问时间'
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '状态: 0开启，1禁用'
      }
    },
    associate: ({ secret }) => {
      secret.belongsTo(options.getUserModel(), {
        foreignKey: 'userId'
      });
    },
    options: {
      comment: '密钥'
    }
  };
};

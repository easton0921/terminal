const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const PasswordResetOtp = sequelize.define(
  "PasswordResetOtp",
  {
    email: {
      type: DataTypes.STRING(254),
      primaryKey: true,
      references: { model: "users", key: "email" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    otp_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    attempts: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "password_reset_otps",
    timestamps: false,
  },
)

module.exports = PasswordResetOtp

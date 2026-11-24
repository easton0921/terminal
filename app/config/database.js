const { Sequelize } = require("sequelize")

const databaseOptions = {
  dialect: "postgres",
  logging: false,
}

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, databaseOptions)
  : new Sequelize(
      process.env.PGDATABASE ||
        process.env.PGUSER ||
        process.env.USERNAME ||
        process.env.USER ||
        "postgres",
      process.env.PGUSER || process.env.USERNAME || process.env.USER || "postgres",
      process.env.PGPASSWORD || "",
      {
        ...databaseOptions,
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT) || 5432,
      },
    )

module.exports = sequelize

const Sequelize = require('sequelize');

if (process.env.NODE_ENV === "development") {
  // ------ SQLite Local Database ------
  const sequelize = new Sequelize('database', 'username', 'password', {
    dialect: 'sqlite',
    storage: 'data/db/dev.sqlite',
    // operatorsAliases: false,
    logging: false
  });
  
  sequelize
    .authenticate()
    .then(() => {
      console.log('\x1b[32mSqlite connection established successfully.\x1b[0m');
    })
    .catch(err => {
      console.error('\x1b[31mUnable to connect to the Sqlite database:' + err + '\x1b[0m');
    });

  module.exports = sequelize;
} else {
  // ------ MySQL GCP Database ------
  const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    dialect: 'mysql',
    host: process.env.DB_HOST,
    // operatorsAliases: false,
    logging: false
  });

  sequelize
    .authenticate()
    .then(() => {
      console.log('\x1b[34mMySQL connection established successfully.\x1b[0m');
    })
    .catch(err => {
      console.error('\x1b[31mUnable to connect to the MySQL database:' + err + '\x1b[0m');
    });

  module.exports = sequelize;
}

const Sequelize = require('sequelize');
// ------ SQLite Local Database ------
// const sequelize = new Sequelize('database', 'username', 'password', {
//   dialect: 'sqlite',
//   storage: 'data/db/dev.sqlite',
//   operatorsAliases: false,
//   logging: false
// });

// sequelize
//   .authenticate()
//   .then(() => {
//     console.log('Sqlite connection established successfully.');
//   })
//   .catch(err => {
//     console.error('Unable to connect to the database:', err);
//   });

// ------ MySQL GCP Database ------
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  dialect: 'mysql',
  host: process.env.DB_HOST,
  operatorsAliases: false,
  logging: false
});

sequelize
  .authenticate()
  .then(() => {
    console.log('MySQL connection established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize;
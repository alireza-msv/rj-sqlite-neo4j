const neo4j = require('neo4j-driver');
const config = require('../config');

const driver = neo4j.driver(
  config.neo4jSever,
  neo4j.auth.basic(config.neo4jUser, config.neo4jPass),
);
const session = driver.session();

module.exports = {
  driver,
  session,
};

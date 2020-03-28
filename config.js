const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  neo4jSever: process.env.NEO4J_SERVER,
  neo4jUser: process.env.NEO4J_USER,
  neo4jPass: process.env.NEO4J_PASS,
};

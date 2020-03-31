const knex = require('../modules/knex');
const { driver, session } = require('../modules/neo4j');

const createArtistNode = async () => {
  const artists = await knex
    .select('*')
    .from('artists')
    .whereNot({ status: 'MERGED' });

  if (artists.length) {
    const [{ name, perma, thumb }] = artists;
    console.log(`creating node for ${name} (${perma})`);
    const query = 'MERGE (a:Artist {name: $name, perma: $perma, thumb: $thumb}) RETURN a';
    const params = { name, perma: decodeURIComponent(perma), thumb };

    await session.run(query, params);
    await knex('artists')
      .where({ perma })
      .update({ status: 'MERGED' });

    setTimeout(() => {
      createArtistNode();
    }, 1000);
  } else {
    console.log('no unmerged artist found');
    await driver.close();
  }
};

module.exports = {
  createArtistNode,
};

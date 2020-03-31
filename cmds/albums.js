const knex = require('../modules/knex');
const { driver, session } = require('../modules/neo4j');

const createAlbumsNode = async () => {
  const [album] = await knex('albums')
    .select('*')
    .where({ status: 'CRAWLED' })
    .limit(1);

  if (album) {
    const { name, perma, album_art: thumb } = album;
    console.log(`creating node and relationships of ${name}(${perma})`);
    const query = 'MATCH (a:Artist {perma: $artistPerma}) MERGE (n:Album {name: $name, perma: $perma, thumb: $thumb})<-[r:ARTIST]-(a)';
    const params = {
      artistPerma: decodeURIComponent(album.artist_perma),
      name,
      perma: decodeURIComponent(perma),
      thumb,
    };

    await session.run(query, params);
    await knex('albums')
      .update({ status: 'MERGED' })
      .where({ perma: album.perma });

    console.log('done');

    setTimeout(() => {
      createAlbumsNode();
    }, 1000);
  } else {
    await driver.session();
    console.log('No unmerged album found');
  }
};

module.exports = {
  createAlbumsNode,
};

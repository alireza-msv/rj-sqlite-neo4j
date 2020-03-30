const knex = require('../modules/knex');
const { driver, session } = require('../modules/neo4j');

const createAlbumNode = async (mp3) => {
  console.log('creating album relataionship');
  const albumQuery = `MATCH (n:Mp3 {perma: $perma}), (a:Album {perma: $albumPerma})
    MERGE (n)-[r:ALBUM {index:${mp3.index}}]->(a)`;
  const albumParams = {
    perma: mp3.perma,
    albumPerma: mp3.album_perma,
  };

  await session.run(albumQuery, albumParams);
};

const createLyricsNode = async (mp3) => {
  console.log('creating lyrics node and relationship');
  const lyricsQuery = `MATCH (m:Mp3 {perma: $perma})
    MERGE (l: Lyric {text: $text})-[r:LYRICS]->(m)`;
  const lyricsParam = { perma: mp3.perma, text: mp3.lyrics };

  await session.run(lyricsQuery, lyricsParam);
};

const createDescriptionNode = async (artist, role, mp3) => {
  const roleUppered = role
    .replace(/[,.:;&-/]/g, '_')
    .replace(/\s/g, '_')
    .replace(/2nd/g, 'second')
    .replace(/___/g, '_')
    .replace(/__/g, '_')
    .toUpperCase();
  const descQuery = 'MERGE (a:Artist {name: $artistName, perma: $artistPerma})';
  const descParams = {
    artistPerma: artist.trim().replace(/\s/g, '+'),
    artistName: artist.trim(),
  };

  await session.run(descQuery, descParams);

  const relQuery = `MATCH (m:Mp3 {perma: $perma}),
  (a:Artist {perma: $artistPerma}) MERGE (m)<-[r:${roleUppered}]-(a)`;
  const relParams = {
    perma: mp3.perma,
    artistPerma: artist.trim().replace(/\s/g, '+'),
  };

  await session.run(relQuery, relParams);
};

const createMp3Node = async () => {
  const [mp3] = await knex('mp3s')
    .select('*')
    .where({ status: 'CRAWLED' })
    .limit(1);

  if (mp3) {
    const {
      name,
      perma,
      artist_perma: artistPerma,
      likes,
      dislikes,
      plays,
      date_added: dateAdded,
      mp3_id: mp3Id,
    } = mp3;
    console.log(`creating node and relationships of ${name} (${perma})`);
    const query = `MERGE (n:Mp3 {
      name: $name, perma: $perma, likes: $likes, dislikes: $dislikes, plays: $plays, dateAdded: $dateAdded, mp3Id: $mp3Id
    })`;
    const params = {
      name,
      perma,
      likes,
      dislikes,
      plays,
      dateAdded,
      mp3Id,
    };

    await session.run(query, params);

    const relationQuery = 'MATCH (a:Artist {perma: $artistPerma}), (n:Mp3 {perma: $perma}) MERGE (n)<-[r:VOCALIST]-(a)';
    const relationParams = {
      artistPerma,
      perma,
    };

    await session.run(relationQuery, relationParams);

    if (mp3.album) {
      await createAlbumNode(mp3);
    }

    if (mp3.lyrics) {
      await createLyricsNode(mp3);
    }

    if (mp3.description) {
      console.log('creating description nodes and relationships');
      const desc = mp3.description.split('\n');

      for (let i = 0; i < desc.length; i += 1) {
        const [role, artist] = desc[i].split(':');

        if (role && artist) {
          await createDescriptionNode(artist, role, mp3);
        }
      }
    }

    await knex('mp3s')
      .update({ status: 'MERGED' })
      .where({ perma });
    console.log('done');

    setTimeout(() => {
      createMp3Node();
    }, 1000);
  } else {
    console.log('no unmerged mp3 found');
    await driver.close();
  }
};

module.exports = {
  createMp3Node,
};

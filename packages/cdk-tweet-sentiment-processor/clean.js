const moment = require('moment');

const clean = async (tweet) => {
  console.log('Cleans a tweet.');
  try {
    const createdAt = moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY');
    const clean = {
      id: tweet.id_str,
      text: tweet.full_text,
      coordinates: tweet.coordinates,
      lang: tweet.lang,
      createdAt: createdAt.utc().format('YYYY-MM-DD HH:mm:ss'),
      term: tweet.term
    };
    console.log('Cleaned a tweet.', JSON.stringify(clean));
    return clean;
  } catch (error) {
    console.log('Failed to clean a tweet.', error);
    throw error;
  }
};

module.exports = clean;

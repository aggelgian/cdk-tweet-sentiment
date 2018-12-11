const Twitter = require('twitter');

const checkpoints = require('./checkpoints');
const faucet = require('./faucet');

const handler = async (event, context) => {
  console.log('Produces tweets.');
  try {
    const terms = process.env.TWITTER_TERMS.split(',').map(t => t.trim());
    const twitter = new Twitter({
      bearer_token: process.env.TWITTER_BEARER_TOKEN,
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET
    });

    for (const term of terms) {
      console.log(`Process term: ${term}.`);

      let max_id = undefined;
      let since_id = await checkpoints.getCheckpoint(term);
      let next_since_id = 0;
      const found = new Set();
      let nfound = 0;
      do {
        const query = {
          q: term,
          count: Number.parseInt(process.env.BATCH_SIZE, 10),
          tweet_mode: 'extended',
          max_id,
          since_id
        };
        console.log('Query Twitter:', JSON.stringify(query));

        const response = await twitter.get('search/tweets', query);

        nfound = 0;
        max_id = response.search_metadata.max_id;
        for (const tweet of response.statuses) {
          if (found.has(tweet.id)) {
            continue;
          }

          found.add(tweet.id);
          tweet.term = term;
          await faucet.putRecord(tweet);
          nfound++;

          if (tweet.id < max_id) {
            max_id = tweet.id;
          }
          if (tweet.id > next_since_id) {
            next_since_id = tweet.id;
          }
        }
        console.log(`Found ${nfound} new tweets.`);
      } while (nfound > 0 && found.size < process.env.MAX_TWEETS);

      if (since_id !== next_since_id) {
        console.log('Update the "since_id".');
        await checkpoints.saveCheckpoint(term, next_since_id);
      } else {
        console.log('Keep the same "since_id".');
      }
      console.log(`Retrieved ${found.size} tweets for ${term}.`);
    }
    console.log('Produced tweets.');
  } catch (error) {
    console.log('Failed to produce tweets.', error);
    throw error;
  }
};

module.exports = {
  handler
};

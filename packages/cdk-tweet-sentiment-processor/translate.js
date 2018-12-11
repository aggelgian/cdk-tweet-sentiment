const aws = require('aws-sdk');

const translate = new aws.Translate();

const tr = async (tweet) => {
  console.log('Translates a tweet.');
  try {
    if (tweet.lang === 'en') {
      console.log('The tweet is already in English.');
      return { ...tweet, englishText: tweet.text };
    }
    const query = {
      SourceLanguageCode: 'auto',
      TargetLanguageCode: 'en',
      Text: tweet.text
    };
    console.log('Queries translation service.', JSON.stringify(query));
    const response = await translate.translateText(query).promise();
    console.log(`The original text was in ${response.SourceLanguageCode}.`);
    const translated = { ...tweet, englishText: response.TranslatedText };
    console.log('Translated a tweet.', JSON.stringify(translated));
    return translated;
  } catch (error) {
    console.log('Failed to translate a tweet.', error);
    console.log('Use the text as the English translation.');
    return { ...tweet, englishText: tweet.text };
  }
};

module.exports = tr;

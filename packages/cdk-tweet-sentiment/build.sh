#! /bin/bash

set -euo pipefail

DESTINATION="$PWD/lambdas"
rm -fr $DESTINATION

bundle () {
  SOURCE="$(node -e "console.log(path.dirname(require.resolve('${1}/package.json')))")"
  pushd $SOURCE
  
  TGZ="$SOURCE/$(npm pack)"
  TMP=$(mktemp -d)
  cd $TMP
  tar --strip-components=1 -xzvf $TGZ
  rm $TGZ
  
  cd $TMP
  mkdir -p $DESTINATION
  zip -r $DESTINATION/$1.zip .
  popd
  rm -fr $TMP
}

# Copy assets.
rm -fr images
cp -f ../../README.md .
cp -r ../../images .

bundle "cdk-tweet-sentiment-aggregator"
bundle "cdk-tweet-sentiment-processor"
bundle "cdk-tweet-sentiment-producer"

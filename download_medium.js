// TODO: we should create a post and download all the images
const mediumToMarkdown = require('medium-to-markdown');
 
// Enter url here
mediumToMarkdown.convertFromUrl('https://medium.com/@matthewfcarlson/nintendo-64-architecture-and-history-8a01cf503a6a?source=friends_link&sk=d4e9690a8a105a53d7994ca9e257d168')
.then(function (markdown) {
  console.log(markdown); //=> Markdown content of medium post
});
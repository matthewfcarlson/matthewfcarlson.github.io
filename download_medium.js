// TODO: we should create a post and download all the images
const mediumToMarkdown = require('medium-to-markdown');
 
// Enter url here
mediumToMarkdown.convertFromUrl('https://medium.com/@matthewfcarlson/roads-where-were-going-we-won-t-have-any-roads-dd9e5a27c30d')
.then(function (markdown) {
  console.log(markdown); //=> Markdown content of medium post
});
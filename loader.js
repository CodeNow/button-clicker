(function () {
  console.log('Loader...')
  var scriptURL = 'http://cdn.rawgit.com/Runnable/button-clicker/master/index.js'
  var js = document.createElement("script");
  js.type = "text/javascript";
  js.src = scriptURL;
  document.body.appendChild(js);
}())

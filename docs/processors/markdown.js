var Q = require('q');
var marked = require('marked');
var exec = require('child_process').exec;

var TITLE = /#[ ]?(.+)/;

module.exports = function renderMarkdownProcessor() {
  return {
    $runAfter: ['files-read'],
    $runBefore: ['parsing-tags'],
    $process: function(docs) {
      return Q.all(docs.map(function(doc) {
        if (doc.docType !== 'markdownFile') {
          return doc;
        }
        return Q.nfcall(markdownize, doc.fileInfo.content).then(function (rendered) {
          return {
            fileInfo: doc.fileInfo,
            name: getTitle(doc.fileInfo.content),
            renderedContent: rendered,
            docType: 'markdown'
          };
        });
      }));
    }
  };
};

function getTitle(md) {
  return md.match(TITLE)[1];
}

function markdownize(str, cb) {
  marked(str, {
    highlight: function (code, lang, callback) {
      if (lang === 'dot') {
        graphvizualize(code, callback);
      } else {
        return callback(null, code);
      }
    }
  }, cb);
}


// make a graphviz thing
function graphvizualize(data, cb) {
  var cp = exec('dot -Tsvg');

  // buffer stdout
  var buf = '';
  cp.stdout.on('data', function (data) {
    buf += data;
  });
  cp.stdout.on('end', function () {
    cb(null, buf);
  });

  // set dot to stdin
  cp.stdin.end(data);
}

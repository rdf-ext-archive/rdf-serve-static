var Promise = require('bluebird')
var absoluteUrl = require('ldapp-absolute-url').init()
var bodyParser = require('rdf-body-parser')
var glob = Promise.promisify(require('glob'))
var mime = require('mime')
var path = require('path')
var readFile = Promise.promisify(require('fs').readFile)
var stat = Promise.promisify(require('fs').stat)

function fileExists (filename) {
  return new Promise(function (resolve) {
    stat(filename).then(function (stats) {
      if (stats.isFile()) {
        resolve(true)
      } else {
        resolve(false)
      }
    }).catch(function () {
      resolve(false)
    })
  })
}

function globFiles (filename) {
  return glob(filename + '.*')
}

function findFiles (filename) {
  return fileExists(filename).then(function (exists) {
    if (exists) {
      return [filename]
    } else {
      return globFiles(filename)
    }
  })
}

function findGraph (filename, formats, options) {
  options = options || {}

  return findFiles(filename).then(function (filenames) {
    return Promise.all(filenames.map(function (filename) {
      var mediaType = mime.lookup(filename)

      if (mediaType in formats.parsers) {
        return readFile(filename).then(function (content) {
          return formats.parsers.parse(mediaType, content.toString(), null, options.base ? options.base : ('file://' + filename))
        })
      }
    }).filter(function (parse) {
      return parse
    })).then(function (graphs) {
      return graphs.filter(function (graph) {
        return graph
      }).shift()
    })
  })
}

function injectAbsoluteUrl (req, res) {
  if (typeof req.absoluteUrl === 'function') {
    return Promise.resolve()
  }

  return new Promise(function (resolve) {
    absoluteUrl(req, res, resolve)
  })
}

function init (root, formats) {
  root = root || '.'

  var bodyParserInstance = bodyParser(formats)

  return function (req, res, next) {
    injectAbsoluteUrl(req, res).then(function () {
      return findGraph(path.join(root, req.path), formats, {base: req.absoluteUrl()})
    }).then(function (graph) {
      if (graph) {
        bodyParserInstance(req, res, function () {
          res.sendGraph(graph)
        })
      } else {
        next()
      }
    }).catch(function (error) {
      next(error)
    })
  }
}

init.findFiles = findFiles
init.findGraph = findGraph

module.exports = init

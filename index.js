const absoluteUrl = require('absolute-url')
const bodyParser = require('rdf-body-parser')
const fs = require('fs')
const globRaw = require('glob')
const mime = require('mime')
const path = require('path')
const Promise = require('bluebird')

const glob = Promise.promisify(globRaw)
const stat = Promise.promisify(fs.stat)

function fileExists (filename) {
  return new Promise((resolve) => {
    stat(filename).then((stats) => {
      if (stats.isFile()) {
        resolve(true)
      } else {
        resolve(false)
      }
    }).catch(() => {
      resolve(false)
    })
  })
}

function globFiles (filename) {
  return glob(filename + '.*')
}

function findFiles (filename) {
  return fileExists(filename).then((exists) => {
    if (exists) {
      return [filename]
    } else {
      return globFiles(filename)
    }
  })
}

function findStream (filename, formats, options) {
  options = options || {}

  return findFiles(filename).then((filenames) => {
    return Promise.all(filenames.map((filename) => {
      const mediaType = mime.lookup(filename)
      const parser = formats.parsers.find(mediaType)

      if (parser) {
        const baseIRI = options.baseIRI ? options.baseIRI : ('file://' + filename)

        return parser.import(fs.createReadStream(filename), {
          baseIRI: baseIRI
        })
      } else {
        return null
      }
    }).filter((stream) => {
      return stream
    })).then((streams) => {
      return streams.shift()
    })
  })
}

function init (root, formats) {
  root = root || '.'

  const bodyParserInstance = bodyParser(formats)

  return (req, res, next) => {
    absoluteUrl.attach(req)

    findStream(path.join(root, req.path), formats, {baseIRI: req.absoluteUrl()}).then((stream) => {
      if (stream) {
        bodyParserInstance(req, res, () => {
          res.graph(stream).catch(next)
        })
      } else {
        next()
      }
    }).catch((err) => {
      next(err)
    })
  }
}

init.findFiles = findFiles
init.findStream = findStream

module.exports = init

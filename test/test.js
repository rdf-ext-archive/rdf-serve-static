/* global describe, it */

const absoluteUrl = require('absolute-url')
const assert = require('assert')
const express = require('express')
const formats = require('rdf-formats-common')()
const rdf = require('rdf-ext')
const request = require('supertest')
const serve = require('..')

describe('rdf-serve-static', () => {
  describe('.findFiles', () => {
    it('should find file with complete path', () => {
      return serve.findFiles('test/support/a.ttl').then((files) => {
        assert.deepEqual(files, ['test/support/a.ttl'])
      })
    })

    it('should find without file extension', () => {
      return serve.findFiles('test/support/a').then((files) => {
        assert.deepEqual(files, ['test/support/a.ttl'])
      })
    })

    it('should return an empty error if no file was found', () => {
      return serve.findFiles('test/support/z').then((files) => {
        assert.deepEqual(files, [])
      })
    })

    it('should return an empty error if file is a folder', () => {
      serve.findFiles('test/support/y').then((files) => {
        assert.deepEqual(files, [])
      })
    })
  })

  describe('.findStream', () => {
    it('should return a stream', () => {
      return serve.findStream('test/support/a', formats).then((stream) => {
        assert(stream)
        assert(stream.readable)

        return rdf.dataset().import(stream).then((dataset) => {
          assert.equal(dataset.toArray().shift().subject.value, 'http://example.org/subject/a')
        })
      })
    })

    it('should return null if no file was found', () => {
      return serve.findStream('test/support/z', formats).then((stream) => {
        assert(!stream)
      })
    })

    it('should return null if no parser was found', () => {
      return serve.findStream('test/support/b', formats).then((stream) => {
        assert(!stream)
      })
    })
  })

  describe('middleware', () => {
    it('should return the requested file in turtle format', () => {
      const app = express()

      app.use(serve('test/support', formats))

      return request(app)
        .get('/a')
        .set('accept', 'application/n-triples')
        .then((res) => {
          assert.equal(res.statusCode, 200)
          assert(res.text.indexOf('<http://example.org/subject/a>') >= 0)
        })
    })

    it('should return 404 if no file was found', () => {
      const app = express()

      app.use(serve('test/support', formats))

      return request(app)
        .get('/z')
        .set('accept', 'application/n-triples')
        .then((res) => {
          assert.equal(res.statusCode, 404)
        })
    })

    it('should return 404 if no parser was found', () => {
      const app = express()

      app.use(serve('test/support', formats))

      return request(app)
        .get('/b')
        .set('accept', 'application/n-triples')
        .then((res) => {
          assert.equal(res.statusCode, 404)
        })
    })

    it('should use . as base path if null was given', () => {
      const app = express()

      app.use(serve(null, formats))

      return request(app)
        .get('/test/support/a')
        .set('accept', 'application/n-triples')
        .then((res) => {
          assert.equal(res.statusCode, 200)
        })
    })

    it('should use the requested url as parser base', () => {
      const app = express()

      app.use(serve('test/support', formats))

      return request(app)
        .get('/c')
        .set('accept', 'application/n-triples')
        .then((res) => {
          assert.equal(res.statusCode, 200)
          assert(res.text.match(/http:\/\/127.0.0.1:[0-9]*\/c/))
        })
    })

    it('should use an existing absolute url middleware', () => {
      const app = express()

      app.use(absoluteUrl({basePath: 'test'}))
      app.use(serve('test/support', formats))

      return request(app)
        .get('/c')
        .set('accept', 'application/n-triples')
        .then((res) => {
          assert.equal(res.statusCode, 200)
          assert(res.text.match(/http:\/\/127.0.0.1:[0-9]*\/test\/c/))
        })
    })
  })
})

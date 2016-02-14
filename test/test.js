/* global describe, it */
var absoluteUrl = require('ldapp-absolute-url').init
var assert = require('assert')
var express = require('express')
var formats = require('rdf-formats-common')()
var request = require('supertest-as-promised')
var serve = require('..')

describe('serve-static', function () {
  describe('.findFiles', function () {
    it('should find file with complete path', function (done) {
      serve.findFiles('test/support/a.ttl').then(function (files) {
        assert.deepEqual(files, ['test/support/a.ttl'])

        done()
      }).catch(done)
    })

    it('should find without file extension', function (done) {
      serve.findFiles('test/support/a').then(function (files) {
        assert.deepEqual(files, ['test/support/a.ttl'])

        done()
      }).catch(done)
    })

    it('should return an empty error if no file was found', function (done) {
      serve.findFiles('test/support/z').then(function (files) {
        assert.deepEqual(files, [])

        done()
      }).catch(done)
    })

    it('should return an empty error if file is a folder', function (done) {
      serve.findFiles('test/support/y').then(function (files) {
        assert.deepEqual(files, [])

        done()
      }).catch(done)
    })
  })

  describe('.findGraph', function () {
    it('should return a graph', function (done) {
      serve.findGraph('test/support/a', formats).then(function (graph) {
        assert(graph)
        assert.equal(graph.length, 1)
        assert.equal(graph.toArray().shift().subject.toString(), 'http://example.org/subject/a')

        done()
      }).catch(done)
    })

    it('should return null if no file was found', function (done) {
      serve.findGraph('test/support/z', formats).then(function (graph) {
        assert(!graph)

        done()
      }).catch(done)
    })

    it('should return null if no parse was found', function (done) {
      serve.findGraph('test/support/b', formats).then(function (graph) {
        assert(!graph)

        done()
      }).catch(done)
    })
  })

  describe('middleware', function () {
    it('should return the requested file in turtle format', function (done) {
      var app = express()

      app.use(serve('test/support', formats))

      request(app)
        .get('/a')
        .set('Accept', 'text/turtle')
        .then(function (res) {
          assert.equal(res.statusCode, 200)
          assert(res.text.indexOf('<http://example.org/subject/a>') >= 0)

          done()
        })
        .catch(done)
    })

    it('should return 404 if no file was found', function (done) {
      var app = express()

      app.use(serve('test/support', formats))

      request(app)
        .get('/z')
        .set('Accept', 'text/turtle')
        .then(function (res) {
          assert.equal(res.statusCode, 404)

          done()
        })
        .catch(done)
    })

    it('should return 404 if no parser was found', function (done) {
      var app = express()

      app.use(serve('test/support', formats))

      request(app)
        .get('/b')
        .set('Accept', 'text/turtle')
        .then(function (res) {
          assert.equal(res.statusCode, 404)

          done()
        })
        .catch(done)
    })

    it('should use . as base path if null was given', function (done) {
      var app = express()

      app.use(serve(null, formats))

      request(app)
        .get('/test/support/a')
        .set('Accept', 'text/turtle')
        .then(function (res) {
          assert.equal(res.statusCode, 200)

          done()
        })
        .catch(done)
    })

    it('should use the requested url as parser base', function (done) {
      var app = express()

      app.use(serve('test/support', formats))

      request(app)
        .get('/c')
        .set('Accept', 'text/turtle')
        .then(function (res) {
          assert.equal(res.statusCode, 200)
          assert(res.text.match(/http:\/\/127.0.0.1:[0-9]*\/c/))

          done()
        })
        .catch(done)
    })

    it('should use an existing absolute url middleware', function (done) {
      var app = express()

      app.use(absoluteUrl({basePath: 'test'}))
      app.use(serve('test/support', formats))

      request(app)
        .get('/c')
        .set('Accept', 'text/turtle')
        .then(function (res) {
          assert.equal(res.statusCode, 200)
          assert(res.text.match(/http:\/\/127.0.0.1:[0-9]*\/test\/c/))

          done()
        })
        .catch(done)
    })
  })
})

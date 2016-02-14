# rdf-serve-static

[![Build Status](https://travis-ci.org/rdf-ext/rdf-serve-static.svg?branch=master)](https://travis-ci.org/rdf-ext/rdf-serve-static)
[![NPM Version](https://img.shields.io/npm/v/rdf-serve-static.svg?style=flat)](https://npm.im/rdf-serve-static)

It's like server-static, just for RDF Graphs with content negotiation. 

## Usage

Here is a small example that hosts all RDF files in the folder `files`: 

    var express = require('express')
    var formats = require('rdf-formats-common')

    var app = express()

    app.use(serve('files', formats))

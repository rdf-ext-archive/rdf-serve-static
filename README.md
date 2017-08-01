# rdf-serve-static

[![Build Status](https://travis-ci.org/rdf-ext/rdf-serve-static.svg?branch=master)](https://travis-ci.org/rdf-ext/rdf-serve-static)
[![npm version](https://badge.fury.io/js/rdf-serve-static.svg)](https://badge.fury.io/js/rdf-serve-static)

It's like server-static, just for RDF Graphs with content negotiation. 

## Usage

Here is a small example that hosts all RDF files in the folder `files`: 

    const express = require('express')
    const formats = require('rdf-formats-common')()

    const app = express()

    app.use(serve('files', formats))

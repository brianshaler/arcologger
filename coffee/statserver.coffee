_ = require 'lodash'
path = require 'path'
express = require 'express'
bodyParser = require 'body-parser'
levelup = require 'levelup'
es = require 'event-stream'
Promise = require 'when'

config = require '../conf/config.json'
Bucketer = require './bucketer'

class StatServer
  constructor: (@db) ->
    @bucketer = Bucketer @db

  start: ->
    app = express()

    app.use express.static __dirname + '/public'

    app.use bodyParser.json()
    app.use bodyParser.urlencoded extended: true

    app.get '/test.json', (req, res, next) =>
      opt =
        start: '2'
        limit: 2

      results = []
      @db.createReadStream opt
      .on 'data', (data) ->
        results.push data
      .on 'close', ->
        res.send results
      #.pipe res

    app.get '/data.:format?', (req, res, next) =>
      startTime = parseInt req.query.start
      endTime = parseInt req.query.end
      step = parseInt req.query.step
      cacheStep = parseInt req.query.cache
      cacheStep = 0 unless cacheStep > 0

      save = if req.query.save == 'true' then true else false

      unless endTime > 0
        endTime = Date.now()
      unless startTime > 0
        startTime = 0
      duration = endTime - startTime

      ###
      unless step > 0 and duration / step < 2000
        console.log 'bad step', req.query.step, duration, step
        step = Math.floor duration / 1000
        step = 1000 if step < 1000
      ###
      unless step > 0 and duration / step < 2000
        endTime = startTime + step * 2000

      res.setHeader 'Content-Type', 'application/json'
      @bucketer.get startTime, endTime, step, cacheStep, save
      .then (data) ->
        res.send data
      .catch (err) ->
        res.send err

    app.get '/cache.:format?', (req, res, next) =>
      days = parseInt req.query.days
      days = 1 unless days > 1

      @cache days, (err) =>
        res.send 'done'

    app.get '/clean.:format?', (req, res, next) =>
      last = Date.now()
      first = Date.now() - 86400 * 1000 * 365

      ws = @db.createWriteStream()

      opt =
        end: "" + first

      @db.createReadStream opt
      .on 'data', (data) ->
        ws.write
          type: 'del'
          key: data.key
      .on 'close', =>
        opt =
          start: "" + last
        @db.createReadStream opt
        .on 'data', (data) ->
          ws.write
            type: 'del'
            key: data.key
        .on 'close', ->
          res.send 'done'

    app.post '/save.:format', (req, res, next) =>
      payload = JSON.parse req.body.payload
      res.send req.body.payload

    app.post '/test.:format', (req, res, next) =>
      payload = JSON.parse req.body.payload
      res.send req.body.payload

    app.listen config.server.port
    console.log "listening on port", config.server.port

  cache: (days = 1, next) =>
    deferred = Promise.defer()
    promise = deferred.promise
    deferred.resolve()

    maxTime = Date.now()
    minTime = maxTime - 86400 * 1000 * days
    for pow in [@bucketer.MIN_BUCKET..@bucketer.MAX_BUCKET] by 1
      do (pow) =>
        step = 1000 * Math.pow 2, pow
        promise = promise.then =>
          cacheStep = null
          if pow > @bucketer.MIN_BUCKET
            cacheStep = step / 2
          @bucketer.get minTime, maxTime, step, cacheStep, true
    promise
    .then ->
      next()
    .catch (err) ->
      next err

  autoCache: =>
    @cache 1, =>
      setTimeout =>
        @autoCache()
      , 60 * 1000

module.exports = (db) ->
  new StatServer db
###

_ = require 'lodash'
Promise = require 'when'


class Bucketer
  MAX_BUCKET: 12
  MIN_BUCKET: 1
  
  constructor: (@db) ->
    
  
  getPower: (step, restrict = false) ->
    pow = Math.floor Math.log(step) / Math.log(2)
    if restrict
      pow = Bucketer::MAX_BUCKET if pow > Bucketer::MAX_BUCKET
      pow = Bucketer::MIN_BUCKET unless pow > Bucketer::MIN_BUCKET
    pow
  
  normalizeStep: (step, restrict = false) ->
    pow = @getPower step / 1000, restrict
    1000 * Math.pow 2, pow
  
  get: (startTime, endTime, step, cacheStep = 0, save = false) ->
    deferred = Promise.defer()
    
    prefix = ""
    step = @normalizeStep step
    if cacheStep > 0
      cacheStep = @normalizeStep cacheStep, true
      if cacheStep == step
        cacheStep = step / 2
      prefix = "#{@getPower cacheStep / 1000}:"
      #console.log 'set prefix', prefix
    
    startTime = step * Math.floor startTime / step
    endTime = step * Math.floor endTime / step
    
    opt =
      start: prefix + startTime
      end: prefix + endTime
    
    #console.log 'get', opt, step, cacheStep
    currentTime = step * Math.floor startTime / step
    bucket = [[],[],[],[],[]]

    summarizeBucket = ->
      summary = []
      if bucket[0]?.length > 0
        #summary = []
        summary = _.map bucket, (metric) ->
          #if metric.min or metric.max or metric.avg
          #  return metric
          #console.log 'metric', metric
          {
            min: _.min _.map metric, (item) -> item.min ? item[1]
            max: _.max _.map metric, (item) -> item.max ? item[2]
            avg: _.reduce(metric, ((sum, item) -> sum + (item.avg ? item[0])), 0) / metric.length
          }
      summary

    #console.log startTime, endTime, step

    results = []
    count = 0
    @db.createReadStream opt
    .on 'data', (data) ->
      count++
      strTime = data.key
      strTime = strTime.replace /.*\:/, ''
      time = parseInt strTime
      if time > currentTime + step
        summary = summarizeBucket()
        if summary
          results.push
            t: currentTime
            d: summary
        currentTime = step + step * Math.floor time / step
        bucket = [[],[],[],[],[]]
      _.each data.value, (record, i) ->
        #if count < 100
        #  console.log time, i, typeof i, record
        bucket[i].push record
    .on 'end', =>
      #console.log "retrieved #{count} records at #{step} resolution"
      summary = summarizeBucket()
      if summary
        results.push
          t: currentTime
          d: summary
      #res.send results
      toCacheStep = @normalizeStep step, true
      if save and toCacheStep == step
        pow = @getPower step / 1000
        
        prefix = "#{@getPower step / 1000}:"
        
        #console.log 'saving', step, step, @getPower(step / 1000), prefix, results.length
        
        ws = @db.createWriteStream()
        ws.on 'close', ->
          deferred.resolve results
        
        _.each results, (result) ->
          ws.write
            key: prefix + result.t
            value: result.d
        ws.end()
      else
        deferred.resolve results
    deferred.promise

  archive: (start, end, step) ->
    

module.exports = (db) ->
  new Bucketer db
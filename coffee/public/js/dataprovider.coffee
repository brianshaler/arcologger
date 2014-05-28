{EventEmitter} = require 'events'
_ = require 'lodash'
config = require './config'

class DataProvider extends EventEmitter
  constructor: ->
    @data = {}
    @queries = []
  
  get: (startTime, endTime) ->
    duration = (endTime - startTime) / 1000
    count = config.resolution
    step = 1000 * Math.pow 2, Math.ceil Math.log(duration / count) / Math.LN2
    
    previous = _.filter @queries, (query) -> query.step == step
    _.each previous, (query) ->
      if query.startTime <= startTime and query.endTime < endTime
        startTime = query.endTime
      if query.endTime >= endTime and query.startTime > startTime
        endTime = query.startTime
    startTime = step * Math.floor startTime / step
    endTime = step * Math.floor endTime / step
    
    return unless endTime - startTime > 0
    
    redundant = _.find previous, (query) -> query.startTime <= startTime and query.endTime >= endTime
    
    return if redundant
    
    @queries.push
      startTime: startTime
      endTime: endTime
      step: step
    
    duration = endTime - startTime
    startTime -= duration * 0.3
    endTime += duration * 0.3
    
    url = "/data.json?start=#{startTime}&end=#{endTime}&step=#{step}&cache=#{step / 2}"
    console.log "DataProvider fetch", url
    $.getJSON url, (data) =>
      console.log 'results', data.length
      _.each data, (item) =>
        @data[step] = [] unless @data[step]?.length > 0
        if item?.d?.length > 0
          @data[step].push item
      @emit 'update', @data
  
  getNearest: (time) ->
    console.log 'dataProvider: getNearest', time
    sorted = []
    for step, items of @data
      if items.length > 0
        sorted.push _.sortBy(items, (item) -> Math.abs item.t - time)[0]
    console.log 'sorted:', sorted
    return null unless sorted.length > 0
    sorted = _.sortBy sorted, (item) -> Math.abs item.t - time
    sorted[0]

module.exports = DataProvider
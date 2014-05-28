_ = require 'lodash'
config = require './config.json'

class Chart
  constructor: (el, startTime) ->
    @parent = el
    @el = $ '<canvas>'
    chart = @el[0]
    @width = chart.width = el.width()
    @height = chart.height = el.height()
    ctx = @el[0].getContext '2d'
    @ctx = ctx
    @data = {}
    
    @initialStartTime = startTime
    @initialEndTime = Date.now()
    @currentStartTime = @initialStartTime
    @currentEndTime = @initialEndTime
  
  update: (data) =>
    console.log 'update!', data
    @data = data
    @render()
  
  render: (startTime = @currentStartTime, endTime = @currentEndTime) =>
    console.log "Chart #{@name}: startTime", startTime, @currentStartTime, @initialStartTime, 'endTime', endTime
    @currentStartTime = startTime
    @currentEndTime = endTime
    ctx = @ctx
    chart = @el[0]
    
    durationSeconds = (endTime - startTime) / 1000
    count = config.resolution
    step = 1000 * Math.pow 2, Math.ceil Math.log(durationSeconds / count) / Math.LN2
    
    console.log 'ideal step', step
    
    steps = _.map Object.keys(@data), (key) -> parseInt key
    steps = _.filter steps, (s) -> s >= step
    step = _.min steps
    
    duration = endTime - startTime
    minT = startTime - step - duration
    maxT = endTime + step + duration
    
    return console.log 'no steps' unless steps.length > 0
    
    console.log 'steps', steps
    counts = []
    for _step in steps
      _data = _.filter @data[_step], (point) -> minT <= point.t <= maxT
      counts.push [_step, _data.length]
    console.log 'counts', counts
    
    counts = _.sortBy counts, (count) -> -count[1]
    step = counts[0][0]
    
    @_step = step
    data = @_data = @data[step]
    data = _.filter data, (point) -> point.d?.length > 0
    
    console.log 'data', data, steps
    ctx.clearRect 0, 0, @width, @height
    
    return console.log 'no data' unless data.length > 0
    
    #return console.log 'just returning'
    
    for metric in config.metrics
      ctx.strokeStyle = metric.color
      
      #points = _.filter data, (point) -> startTime-step-duration <= point.t <= endTime+step+duration
      points = _.map data, (point) ->
        {
          t: point.t
          v: point.d[metric.index]
        }
      points.sort (a, b) ->
        if a.t > b.t
          1
        else
          -1
      
      #points = points.slice 0, 100
      points = _.filter points, (point) -> point?.v?.min?
      
      mins = _.map points, (point) ->
        if !point.v?.min?
          console.log '!point.v?.min?', point
        {
          t: point.t
          v: point.v.min
        }
      avgs = _.map points, (point) ->
        {
          t: point.t
          v: point.v.avg
        }
      maxs = _.map points, (point) ->
        {
          t: point.t
          v: point.v.max
        }
      
      @drawLine '1', mins
      @drawLine '2', avgs
      @drawLine '1', maxs
      #console.log 'drawing line for', metric.name, points.length
  
  drawLine: (lineWidth, points) =>
    return unless points.length > 0
    ctx = @ctx
    ctx.beginPath()
    ctx.lineWidth = lineWidth
    first = true
    scale = @width / (@currentEndTime - @currentStartTime)
    lastPoint = 0
    for point in points
      if point.t < lastPoint
        console.log "Should not happen", lastPoint, point.t
      x = (point.t - @currentStartTime) * scale
      y = @height - (point.v / 1023) * @height
      #console.log '>', x, y, point.v
      if first
        first = false
        ctx.moveTo x, y
      else
        ctx.lineTo x, y
      lastPoint = point.t
    ctx.stroke()
  
module.exports = Chart
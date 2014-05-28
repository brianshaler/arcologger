_ = require 'lodash'
{EventEmitter} = require 'events'

Chart = require './chart'

class Viewport extends EventEmitter
  constructor: (@sel, @startTime, @timeline) ->
    @el = $ @sel
    
    chartHeight = 400
    @el.css
      width: window.innerWidth
      height: chartHeight
    @minTime = @startTime
    @maxTime = @endTime = Date.now()
    
    @chart = new Chart @el, @startTime
    @el.append @chart.el
    
    @timeline.on 'update', @update
    
    @el
    .on 'mousedown', @startDrag
    .on 'mouseup', @endDrag
    .on 'mousemove', @hover
    .on 'mouseleave', @unhover
    
    $ window
    .on 'mousemove', @onDrag
    .on 'mouseleave', @endDrag
  
  update: (currentStartTime, currentEndTime) =>
    return if @chart.currentStartTime == currentStartTime and @chart.currentEndTime == currentEndTime
    #console.log 'update viewport', @chart.initialStartTime, currentStartTime, currentEndTime
    @startTime = currentStartTime
    @endTime = currentEndTime
    @chart.currentStartTime = currentStartTime
    @chart.currentEndTime = currentEndTime
    @chart.render()
  
  startDrag: (e) =>
    @dragging = true
    @startMouseX = e.clientX
    #@render false
    @startStartTime = @startTime
    @ppms = (@endTime - @startTime) / @chart.width
    #console.log 'startDrag', @startLeft, e.clientX
  
  onDrag: (e) =>
    return unless @dragging
    diff = e.clientX - @startMouseX
    duration = @endTime - @startTime
    @startTime = Math.round @startStartTime - @ppms * diff
    @startTime = @minTime unless @startTime > @minTime
    @startTime = @maxTime - duration unless @startTime < @maxTime - duration
    @endTime = @startTime + duration
    #console.log 'x', e.clientX, diff, @startLeft
    @chart.render @startTime, @endTime
    #@el.css
    #  left: @left + diff
    @emit 'update', @startTime
  
  endDrag: (e) =>
    #console.log 'end drag', e
    @dragging = false
  
  hover: (e) =>
    @emit 'hover', e.clientX
  
  unhover: (e) =>
    @emit 'unhover'

module.exports = Viewport

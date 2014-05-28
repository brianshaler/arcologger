_ = require 'lodash'
{EventEmitter} = require 'events'
Chart = require './chart'
Highlight = require './highlight'

class Timeline extends EventEmitter
  constructor: (sel, startTime) ->
    @sel = sel
    @el = $ sel
    
    chartHeight = 80
    @el.css
      width: window.innerWidth
      height: chartHeight
    #@startTime = startTime
    #@endTime = Date.now()
    
    @initialStartTime = @currentStartTime = startTime
    @initialEndTime = @currentEndTime = Date.now()
    @lastEndTime = @currentEndTime
    maxDuration = 86400000
    if @currentEndTime - @currentStartTime > maxDuration
      @currentStartTime = @currentEndTime - maxDuration
    
    @chart = new Chart @el, @initialStartTime
    @chart.height = chartHeight
    @el.append @chart.el
    
    @highlight = new Highlight @chart
    @highlight
    .set
      minTime: @initialStartTime
      maxTime: @initialEndTime
      startTime: @currentStartTime
      endTime: @currentEndTime
    .on 'update', =>
      @currentStartTime = @highlight.startTime
      @currentEndTime = @highlight.endTime
      @emit 'update'
    
    @el.append @highlight.el
    
    setInterval =>
      follow = false
      if @currentEndTime == @lastEndTime
        follow = true
      newEndTime = Date.now()
      diff = newEndTime - @lastEndTime
      if follow
        @currentEndTime = newEndTime
        console.log 'diff', diff
        @currentStartTime += diff
      @lastEndTime = newEndTime
      console.log 'update', @currentStartTime, @currentEndTime, @lastEndTime
      @emit 'update', @currentStartTime, @currentEndTime
    , 10000
    
    # ##
    @on 'update', =>
      @update()
    # ##
    
    setTimeout =>
      @emit 'update', @currentStartTime, @currentEndTime
    , 1
  
  update: =>
    @highlight.set
      minTime: @initialStartTime
      maxTime: @initialEndTime
      startTime: @currentStartTime
      endTime: @currentEndTime
  

module.exports = Timeline

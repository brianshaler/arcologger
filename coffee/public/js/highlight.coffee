{EventEmitter} = require 'events'

HighlightHandle = require './highlightHandle'

class Highlight extends EventEmitter
  constructor: (@chart) ->
    @minTime = @maxTime = @startTime = @endTime = @left = 0
    
    @el = $ '<div>'
    
    @el
    .addClass 'highlight'
    .css
      height: @chart.height
      'margin-top': -@chart.height - 1
    .on 'mousedown', @startDrag
    .on 'mousemove', @onDrag
    .on 'mouseup', @endDrag
    
    @chart.el
    .on 'mousedown', @startDrag2
    .on 'mouseup', @endDrag
    .on 'mousemove', @onDrag
    
    $ 'body'
    .on 'mouseleave', @endDrag
    
    @leftHandle = new HighlightHandle @el, 'left'
    @leftHandle.el.html '&laquo;'
    
    @leftHandle
    .on 'drag', (x) =>
      left = parseInt @el.css('left')
      width = parseInt @el.width()
      diff = left - x
      left -= diff
      width += diff
      @startTime = @minTime + (left) / (@chart.width-4) * (@maxTime - @minTime)
      #@endTime = @minTime + (left+width) / (@chart.width-4) * (@maxTime - @minTime)
      @render()
      @emit 'update'
    
    @rightHandle = new HighlightHandle @el, 'right'
    @rightHandle.el.html '&raquo;'
    
    @rightHandle
    .on 'drag', (x) =>
      left = parseInt @el.css('left')
      width = parseInt @el.width()
      width = x - left
      #@startTime = @minTime + (left) / (@chart.width-4) * (@maxTime - @minTime)
      @endTime = @minTime + (left+width) / (@chart.width-4) * (@maxTime - @minTime)
      @render()
      @emit 'update'
    
    @el.append @leftHandle.el
    @el.append @rightHandle.el
    
    $ '.highlight-handle', @el
    .css
      'margin-top': '1.8em'
      'margin-left': '-0.6em'
    
    @render()
  
  set: (obj) =>
    if obj.startTime?
      @startTime = obj.startTime
    if obj.endTime?
      @endTime = obj.endTime
    if obj.minTime?
      @minTime = obj.minTime
    if obj.maxTime?
      @maxTime = obj.maxTime
    @render()
    @
  
  render: (draw = true) =>
    return unless @startTime > 0 and @maxTime > 0
    total = @maxTime - @minTime
    current = @endTime - @startTime
    w = current / total * @chart.width - 4
    @left = (@startTime - @minTime) / total * @chart.width - 4
    #console.log 'render', @left
    if draw
      @el.css
        width: w
        left: @left
      @leftHandle.el.css
        left: 0 # @left
      @rightHandle.el.css
        left: w # @left + w
  
  startDrag: (e) =>
    @dragging = true
    @startMouseX = e.clientX
    @render false
    @startLeft = @left
    #console.log 'startDrag', @startLeft, e.clientX
  
  startDrag2: (e) =>
    x = e.clientX - @el.width() / 2
    duration = @endTime - @startTime
    @startTime = @minTime + (x / @chart.width) * (@maxTime - @minTime)
    @endTime = @startTime + duration
    
    @startDrag e
    @render()
    @emit 'update'
  
  onDrag: (e) =>
    return true unless @dragging
    e.preventDefault()
    diff = e.clientX - @startMouseX
    duration = @endTime - @startTime
    @startTime = @minTime + (@startLeft + diff) / (@chart.width-4) * (@maxTime - @minTime)
    @startTime = @minTime unless @startTime > @minTime
    @startTime = @maxTime - duration unless @startTime < @maxTime - duration
    @endTime = @startTime + duration
    #console.log 'x', e.clientX, diff, @startLeft
    @render()
    #@el.css
    #  left: @left + diff
    @emit 'update'
    false
  
  endDrag: (e) =>
    return true unless @dragging
    e.preventDefault()
    #console.log 'end drag', e
    @dragging = false
    false

module.exports = Highlight
{EventEmitter} = require 'events'

class HighlightHandle extends EventEmitter
  constructor: (@parent, @dir) ->
    @el = $ '<a>'
    @el
    .addClass 'highlight-handle'
    .attr href: '#'
    .on 'mousedown', @startDrag
    
    $ window
    .on 'mousemove', @onDrag
    .on 'mouseup', @endDrag
    #.on 'mouseleave', @endDrag
  
  startDrag: (e) =>
    e.preventDefault()
    @dragging = true
    @startMouseX = e.clientX
    false
  
  onDrag: (e) =>
    return true unless @dragging
    e.preventDefault()
    #diff = e.clientX - @startMouseX
    @emit 'drag', e.clientX
    false
  
  endDrag: (e) =>
    return true unless @dragging
    e.preventDefault()
    @dragging = false
    #@emit 'endDrag', e
    false

module.exports = HighlightHandle
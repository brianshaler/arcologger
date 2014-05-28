config = require './config.json'

class ChartLabel
  constructor: ->
    @el = $ '<div>'
    @height = 200
    
    @el
    .addClass 'chart-label'
    .html 'label'
  
  show: (x, data) ->
    @el
    .html ""
    .css
      left: x
      height: @height
      'margin-top': -@height
    .show()
    
    vals = []
    for metric in config.metrics
      {min, max, avg} = data.d[metric.index]
      vals.push
        color: metric.color
        avg: avg
    
    
    div = $ '<div>'
    div
    .addClass 'chart-label-metric'
    .css
      color: 'rgba(22, 22, 22, 0.8)'
      'background-color': 'rgba(255, 255, 255, 0.6)'
    .html "#{new Date data.t}"
    @el.append div
    
    vals.sort (a, b) -> if a.avg > b.avg then -1 else 1
    for val in vals
      div = $ '<div>'
      div
      .addClass 'chart-label-metric'
      .css
        'background-color': val.color
      .html "avg: #{Math.round(val.avg*10)/10}"
      @el.append div
  
  hide: ->
    @el.hide()

module.exports = ChartLabel
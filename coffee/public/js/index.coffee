Timeline = require './timeline'
Viewport = require './viewport'
DataProvider = require './dataprovider'
ChartLabel = require './chartLabel'

startTime = 1398047600000

#chartj = $ '#chart'
#chart = chartj[0]
#chart.width = window.innerWidth
#chart.height = 400

dataProvider = new DataProvider()
dataProvider.get startTime, Date.now()

timeline = new Timeline '#chart', startTime
timeline.chart.name = 'timeline'
viewport = new Viewport '#viewport', startTime, timeline
viewport.chart.name = 'viewport'

timeline.on 'update', ->
  startTime = 1000 * Math.floor timeline.currentStartTime / 1000
  endTime = 1000 * Math.ceil timeline.currentEndTime / 1000
  duration = endTime - startTime
  dataProvider.get startTime - duration * .1, endTime + duration * .1
  #console.log 'update', timeline.currentStartTime, timeline.currentEndTime
  viewport.update startTime, endTime

viewport.on 'update', (startTime) ->
  startTime = 1000 * Math.floor viewport.startTime / 1000
  endTime = 1000 * Math.ceil viewport.endTime / 1000
  duration = endTime - startTime
  
  dataProvider.get startTime - duration * .1, endTime + duration * .1
  
  timeline.currentStartTime = startTime
  timeline.currentEndTime = endTime
  timeline.update()

viewportLabel = new ChartLabel()
viewport.el.append viewportLabel.el

viewport.on 'hover', (x) ->
  startTime = viewport.startTime
  endTime = viewport.endTime
  closest = dataProvider.getNearest startTime + (x / viewport.el.width()) * (endTime - startTime)
  return viewportLabel.hide() unless closest
  x = (closest.t - startTime) / (endTime - startTime) * viewport.el.width()
  viewportLabel.height = viewport.el.height()
  viewportLabel.show x, closest
viewport.on 'unhover', (x) ->
  viewportLabel.hide()
  

dataProvider.on 'update', (data) ->
  timeline.chart.update data
  viewport.chart.update data


window.timeline = timeline
window.viewport = viewport

var chartj = $('#chart');
var chart = chartj[0];
chart.width = window.innerWidth;
chart.height = 400;
var ctx = chart.getContext('2d');
var initialStartTime = 1397968928187;
var initialEndTime = 1397970112939;
var currentStartTime, currentEndTime;

var color = [
  "rgba(0, 127, 0, 0.5)",
  "rgba(127, 0, 0, 0.5)",
  "rgba(0, 0, 127, 0.5)"
];

render = function (startTime, endTime) {
  ctx.clearRect(0, 0, chart.width, chart.height);
  currentStartTime = startTime = parseInt(startTime);
  currentEndTime = endTime = parseInt(endTime);
  var step = Math.ceil((endTime-startTime)/chart.width);
  var url = '/data.json?start=' + startTime + '&end=' + endTime + '&step=' + step;
  
  $.getJSON(url, function (data) {
    var records;
    var max = [];
    var min = [];
    var metrics = [];
    _.each(data, function (item) {
      _.each(item.d, function (metric, i) {
        if (!metrics[i]) { metrics[i] = []; }
        metric.time = item.t;
        metrics[i].push(metric);
      });
    });
    
    _.each(metrics, function (metric, i) {
      min[i] = _.min(_.pluck(metric, 'min'));
      max[i] = _.max(_.pluck(metric, 'max'));
    });
    var diff = endTime-startTime;
    _.each(metrics, function (metric, i) {
      var lastX = -1;
      var lastMinY = -1;
      var lastMaxY = -1;
      var lastAvgY = -1;
      _.each(metric, function (record) {
        var time = record.time;
        
        var x = (time-startTime) / diff * chart.width;
        var y;
        var w = Math.ceil(step / diff * chart.width);
        ctx.fillStyle = color[i];
        ctx.strokeStyle = color[i];
        y = chart.height - (record.avg-min[i]) / (max[i]-min[i]) * chart.height;
        ctx.fillRect(x-w/2, y-1, w, 3);
        
        if (lastAvgY != -1) {
          ctx.beginPath();              
          ctx.lineWidth="2";
          ctx.moveTo(lastX, lastAvgY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        lastAvgY = y;
        
        y = chart.height - (record.min-min[i]) / (max[i]-min[i]) * chart.height;
        ctx.fillRect(x-w/2, y-1, w, 1);
        
        if (lastMinY != -1) {
          ctx.beginPath();              
          ctx.lineWidth="1";
          ctx.moveTo(lastX, lastMinY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        lastMinY = y;
        
        y = chart.height - (record.max-min[i]) / (max[i]-min[i]) * chart.height;
        ctx.fillRect(x-w/2, y-1, w, 1);
        
        if (lastMaxY != -1) {
          ctx.beginPath();              
          ctx.lineWidth="1";
          ctx.moveTo(lastX, lastMaxY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        lastMaxY = y;
        
        lastX = x;
      });
    });
    /** /
    return;
    _.each(data, function (item) {
      var time = item.t;
      _.each(item.d, function (metric, i) {
        var diff = endTime-startTime;
        var x = (time-startTime) / diff * chart.width;
        var y;
        var w = Math.ceil(step / diff * chart.width);
        ctx.fillStyle = color[i];
        y = chart.height - (metric.avg-min[i]) / (max[i]-min[i]) * chart.height;
        ctx.fillRect(x, y-1, w, 3);
        y = chart.height - (metric.min-min[i]) / (max[i]-min[i]) * chart.height;
        ctx.fillRect(x, y-1, w, 1);
        y = chart.height - (metric.max-min[i]) / (max[i]-min[i]) * chart.height;
        ctx.fillRect(x, y-1, w, 1);
      });
    });
    /**/
  });
}
render(initialStartTime, initialEndTime);

var p1 = -1, p2 = -1;
chartj.on('mousedown', function (e) {
  p1 = e.offsetX / chart.width;
});
chartj.on('mouseup', function (e) {
  p2 = e.offsetX / chart.width;
  var diff = currentEndTime - currentStartTime;
  render(currentStartTime + diff*p1, currentStartTime + diff*p2);
  p1 = p2 = -1;
});

$('#zoom-out').click(function (e) {
  e.preventDefault();
  var start = currentStartTime + (initialStartTime-currentStartTime)*0.3;
  var end = currentEndTime + (initialEndTime-currentEndTime)*0.3;
  render(start, end);
});
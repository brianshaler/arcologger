var chartj = $('#chart');
var chart = chartj[0];
chart.width = window.innerWidth;
chart.height = 400;
var ctx = chart.getContext('2d');
var initialStartTime = 1398047600000;
var initialEndTime = Date.now();
var currentStartTime, currentEndTime;
var currentUrl;

var color = [
  "rgba(200, 127, 0, 0.5)",
  null,
  "rgba(127, 0, 55, 0.5)",
  "rgba(0, 127, 0, 0.5)",
  "rgba(0, 0, 127, 0.5)"
];

render = function (startTime, endTime) {
  ctx.clearRect(0, 0, chart.width, chart.height);
  currentStartTime = startTime = parseInt(startTime);
  currentEndTime = endTime = parseInt(endTime);
  var step = Math.ceil((endTime-startTime)/chart.width);
  var url = '/data.json?start=' + startTime + '&end=' + endTime + '&step=' + step;
  currentUrl = url;
  
  refreshData(url, startTime, endTime, step);
}

refreshData = function (url, startTime, endTime, step) {
  $.getJSON(url, function (data) {
    if (url != currentUrl) { return; }
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
    
    var currentMetric = 0;
    renderMetric = function () {
      var metric = metrics[currentMetric];
      var i = currentMetric;
      if (!metric || url != currentUrl) {
        return;
      }
      if (!color[currentMetric]) {
        currentMetric++;
        return renderMetric();
      }
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
        
        //y = chart.height - (record.avg-min[i]) / (max[i]-min[i]) * chart.height;
        y = chart.height - record.avg / max[i] * chart.height;
        ctx.fillRect(x-w/2, y-1, w, 3);
        
        if (lastAvgY != -1) {
          ctx.beginPath();              
          ctx.lineWidth="2";
          ctx.moveTo(lastX, lastAvgY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        lastAvgY = y;
        
        //y = chart.height - (record.min-min[i]) / (max[i]-min[i]) * chart.height;
        y = chart.height - record.min / max[i] * chart.height;
        ctx.fillRect(x-w/2, y-1, w, 1);
        
        if (lastMinY != -1) {
          ctx.beginPath();              
          ctx.lineWidth="1";
          ctx.moveTo(lastX, lastMinY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        lastMinY = y;
        
        //y = chart.height - (record.max-min[i]) / (max[i]-min[i]) * chart.height;
        y = chart.height - record.max / max[i] * chart.height;
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
            
      if (currentMetric < metrics.length-1) {
        currentMetric++;
        setTimeout(function () {
          renderMetric();
        }, 1);
      }
    }
    renderMetric();
  });
}
render(initialStartTime, initialEndTime);

var p1 = -1, p2 = -1;
chartj.on('mousedown', function (e) {
  p1 = e.clientX / chart.width;
});
chartj.on('mouseup', function (e) {
  p2 = e.clientX / chart.width;
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
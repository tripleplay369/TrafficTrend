function reset() {
  window.trafficHistory = []
  window.smoothedTrafficHistory = []
  window.trend = ""
  window.trendColor = "#a59e27"
  window.currentInterval = null
  window.trendVal = 0
  window.lastRunTime = 0
  chrome.browserAction.setIcon({path: "default.png"})
  chrome.browserAction.setBadgeText({text: ""})

}
reset()

function smoothHistory() {
  var s_xy = 0
  var s_x = 0
  var s_y = 0
  var s_x2 = 0

  for(var i = 0; i < window.trafficHistory.length; ++i){
    var x = window.trafficHistory[i].timestamp
    var y = window.trafficHistory[i].trafficTime
    s_xy += x * y
    s_x += x
    s_y += y
    s_x2 += x * x
  }

  var n = window.trafficHistory.length
  var a = (n * s_xy - s_x * s_y) / (n * s_x2 - (s_x * s_x))
  var b = (s_y - a * s_x) / n

  window.smoothedTrafficHistory = []
  for(var i = 0; i < window.trafficHistory.length; ++i){
    var x = window.trafficHistory[i].timestamp
    var y = window.trafficHistory[i].trafficTime
    window.smoothedTrafficHistory.push({timestamp: x, trafficTime: a * x + b})
  }
}

function updateTrend() {
  var minutesToCheck = 15
  var threshold = 0.1

  var target = Date.now() - (minutesToCheck * 60 * 1000)

  var closest = null
  var smallestTimeDist = Number.MAX_VALUE

  smoothHistory()

  var history = window.smoothedTrafficHistory
  var newest = history[history.length - 1]
  for(var i = 0; i < history.length; ++i){
    var dist = Math.abs(target - history[i].timestamp)
    if(dist < smallestTimeDist){
      smallestTimeDist = dist
      closest = history[i]
    }
  }

  var thresholdTime = threshold * closest.trafficTime

  window.trendVal = newest.trafficTime - closest.trafficTime

  if(window.trendVal < -thresholdTime){
    chrome.browserAction.setIcon({path: "green.png"})
    chrome.browserAction.setBadgeBackgroundColor({color: '#2f8d16'})
    window.trend = "Decreasing"
    window.trendColor = '#2f8d16'
  }
  else if(window.trendVal > thresholdTime){
    chrome.browserAction.setIcon({path: "red.png"})
    chrome.browserAction.setBadgeBackgroundColor({color: '#bf1b1b'})
    window.trend = "Increasing"
    window.trendColor = '#bf1b1b'
  }
  else{
    chrome.browserAction.setIcon({path: "yellow.png"})
    chrome.browserAction.setBadgeBackgroundColor({color: '#a59e27'})
    window.trend = "Constant"
    window.trendColor = '#a59e27'
  }
}

function run() {
  var interval = 60000
  var flushTime = 90000
  var retryInterval = 1000
  var maxHistoryLength = 15

  if(Date.now() - window.lastRunTime > flushTime){
    reset()
  }
  window.lastRunTime = Date.now()

  chrome.storage.sync.get(['start', 'end'], function(items){
    if(items['start'] && items['end']){
      var start = items['start']
      var end = items['end']

      var urlBase = "https://dev.virtualearth.net/REST/V1/Routes/Driving?o=json&optimize=timeWithTraffic&routeAttributes=routeSummariesOnly&key=ApOHeGHwYDdkH0nNTaK2ZpZxA0hC_6Lcwzq-RCbUZFw9-4MGOl3M1C56DUCTxunB"
      var url = urlBase + "&wp.0=" + encodeURIComponent(start) + "&wp.1=" + encodeURIComponent(end)

      var xhr = new XMLHttpRequest()
      xhr.open("GET", url, false)

      var parsed = null
      try{
        xhr.send()
        parsed = JSON.parse(xhr.response)
      }
      catch(err){}

      if(parsed && parsed.resourceSets.length > 0){

        var time = parsed.resourceSets[0].resources[0].travelDurationTraffic
        window.trafficHistory.push({timestamp: Date.now(), trafficTime: time})
        window.trafficHistory = window.trafficHistory.slice(-1 * maxHistoryLength)

        chrome.browserAction.setBadgeText({text: (time / 60).toFixed(0) + "m"})
        updateTrend()
        window.currentInterval = setTimeout(run, interval)
      }
      else{
        window.currentInterval = setTimeout(run, retryInterval)
      }
    }
  })
}

run()

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if(request.type == "get_history"){
    sendResponse({history: window.trafficHistory, smoothed: window.smoothedTrafficHistory, trend: window.trend, trendColor: window.trendColor, trendVal: window.trendVal})
  }
  else if(request.type == "clear_history"){
    clearInterval(window.currentInterval)
    reset()

    run()
  }
})

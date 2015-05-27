window.trafficHistory = []

function updateIcon() {
  var minutesToCheck = 15
  var threshold = 0.1

  var target = Date.now() - (minutesToCheck * 60 * 1000)

  var closest = null
  var smallestTimeDist = Number.MAX_VALUE

  var history = window.trafficHistory
  var newest = history[history.length - 1]
  for(var i = 0; i < history.length; ++i){
    var dist = Math.abs(target - history[i].timestamp)
    if(dist < smallestTimeDist){
      smallestTimeDist = dist
      closest = history[i]
    }
  }

  var thresholdTime = threshold * newest.trafficTime

  if(newest.trafficTime - closest.trafficTime < -thresholdTime){
    chrome.browserAction.setIcon({path: "green.png"})
    chrome.browserAction.setBadgeBackgroundColor({color: '#3eb81d'})
  }
  else if(newest.trafficTime - closest.trafficTime > thresholdTime){
    chrome.browserAction.setIcon({path: "red.png"})
    chrome.browserAction.setBadgeBackgroundColor({color: '#bf1b1b'})
  }
  else{
    chrome.browserAction.setIcon({path: "yellow.png"})
    chrome.browserAction.setBadgeBackgroundColor({color: '#e1d736'})
  }
}

function run() {
  var interval = 60000
  var retryInterval = 1000
  var maxHistoryLength = 20

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
        updateIcon()
        setTimeout(run, interval)
      }
      else{
        setTimeout(run, retryInterval)
      }
    }
  })
}

run()

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if(request.type == "get_history"){
    sendResponse({history: window.trafficHistory})
  }
})

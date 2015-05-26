function run() {
  var interval = 60000
  var retryInterval = 5000

  chrome.storage.sync.get(['start', 'end'], function(items){
    if(items['start'] && items['end']){
      var start = items['start']
      var end = items['end']

      var urlBase = "https://dev.virtualearth.net/REST/V1/Routes/Driving?o=json&optimize=timeWithTraffic&routeAttributes=routeSummariesOnly&key=ApOHeGHwYDdkH0nNTaK2ZpZxA0hC_6Lcwzq-RCbUZFw9-4MGOl3M1C56DUCTxunB"
      var url = urlBase + "&wp.0=" + encodeURIComponent(start) + "&wp.1=" + encodeURIComponent(end)

      var xhr = new XMLHttpRequest()
      xhr.open("GET", url, false)
      xhr.send()

      var parsed = JSON.parse(xhr.response)
      if(parsed.resourceSets.length > 0){
        var time = parsed.resourceSets[0].resources[0].travelDurationTraffic
        chrome.browserAction.setBadgeText({text: (time / 60).toFixed(0)})
        setTimeout(run, interval)
      }
      else{
        setTimeout(run, retryInterval)
      }
    }
  })
}

run()

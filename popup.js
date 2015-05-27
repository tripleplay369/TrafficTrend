document.addEventListener("DOMContentLoaded", function(event){ 
  var head = document.getElementsByTagName('head')[0]
   var script = document.createElement('script')
   script.type = 'text/javascript'
   script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyD6FCp6NtqDSK1cUZJDtefVPNwvJGV4dcE&callback=initialize"
   head.appendChild(script)
})

window.addClass = function(el, c){
  var classes = el.className.split(" ")
  var index = classes.indexOf(c)
  if(index == -1){
    classes.push(c)
  }
  el.className = classes.join(" ")
}

window.removeClass = function(el, c){
  var classes = el.className.split(" ")
  var index = classes.indexOf(c)
  if(index != -1){
    classes.splice(index, 1)
  }
  el.className = classes.join(" ")
}

window.getEls = function(inputName){
  var inputEl, checkEl, xEl
  if(inputName == "start"){
    inputEl = document.getElementById("start")
    checkEl = document.getElementById("check1")
    xEl = document.getElementById("x1")
  }
  else{
    inputEl = document.getElementById("end")
    checkEl = document.getElementById("check2")
    xEl = document.getElementById("x2")
  }

  return [inputEl, checkEl, xEl]
}

window.goodInput = function(inputName){
  els = getEls(inputName)

  addClass(els[2], "hidden")
  removeClass(els[0], 'red-border')
  removeClass(els[1], "hidden")
  addClass(els[0], 'green-border')
}

window.badInput = function(inputName){
  els = getEls(inputName)

  addClass(els[1], "hidden")
  removeClass(els[0], 'green-border')
  removeClass(els[2], "hidden")
  addClass(els[0], 'red-border')
}

window.clearHistory = function(){
  chrome.runtime.sendMessage({type: "clear_history"})
}

window.showNoDataMessage = function(){
  removeClass(document.getElementById("nodata"), "hidden")
  addClass(document.getElementById("title"), "hidden")
  addClass(document.getElementById("axis-label"), "hidden")
  addClass(document.getElementById("bottom-label"), "hidden")
}

window.initialize = function(){
  startEl = document.getElementById("start")
  endEl = document.getElementById("end")

  chrome.storage.sync.get(['start', 'end'], function(items){
    if(items['start']){
      startEl.value = items['start']
      goodInput("start")
    }
    else{
      removeClass(document.getElementById("x1"), 'hidden')
      badInput("start")
    }

    if(items['end']){
      endEl.value = items['end']
      goodInput("end")
    }
    else{
      removeClass(document.getElementById("x2"), 'hidden')
      badInput("end")
    }
  })

  var changeFunction = function(){
    var address = this.value
    var el = this
    
    geocoder = new google.maps.Geocoder()
    geocoder.geocode({'address': address}, function(results, status){
      if(status == "OK" && results.length == 1){
        var formatted = results[0].formatted_address
        var data = {}
        data[el.id] = formatted
        chrome.storage.sync.set(data, function() {
          el.value = formatted
          goodInput(el.id)
        })
      }
      else{
        chrome.storage.sync.remove(el.id, function(){
          badInput(el.id)
        })
      }

      clearHistory()
      var canvas = document.getElementById("chart")
      var context = canvas.getContext("2d")
      context.clearRect (0, 0, canvas.width, canvas.height)
      showNoDataMessage()

      document.getElementById('time-value').innerHTML = ""
      document.getElementById('trend-value').innerHTML = ""
    })
  }

  startEl.onchange = changeFunction
  endEl.onchange = changeFunction

  var refresh = function(){
    chrome.runtime.sendMessage({type: "get_history"}, function(response){
      var trendValueEl = document.getElementById("trend-value")
      trendValueEl.innerHTML = response.trend
      trendValueEl.style.color = response.trendColor

      if(response.history.length > 0){
        var timeValueEl = document.getElementById("time-value")
        timeValueEl.innerHTML = (response.history[response.history.length - 1].trafficTime / 60).toFixed(0) + " min"
      }

      var maxNumLabels = 5

      var canvas = document.getElementById("chart")
      var context = canvas.getContext("2d")

      var history = response.history

      if(history.length >= 2){
        var now = Date.now()

        var dataArray = []
        var labelArray = []
        for(var i = 0; i < history.length; ++i){
          dataArray.push(history[i].trafficTime / 60)

          var minutes = ((now - history[i].timestamp) / 60000).toFixed(0)
          var shouldLabel = (i % Math.ceil(history.length / maxNumLabels) == 0) || history.length <= maxNumLabels
          labelArray.push(shouldLabel ? ("-" + minutes) : "")
        }

        var data = {
          labels: labelArray,
          datasets: [
            {
              data: dataArray,
              strokeColor: "rgba(151,151,151,1)"
            }
          ]
        }

        var options = {showTooltips: false, bezierCurve: false, pointDot: false, datasetFill: false, scaleFontSize: 12, animation: false}

        var lineChart = new Chart(context).Line(data, options)
      }
      else{
        showNoDataMessage()
      }
    })
  }

  refresh()
  setInterval(refresh, 10000)
}

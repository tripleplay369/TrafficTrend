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
    
    geocoder = new google.maps.Geocoder()
    geocoder.geocode({'address': address}, function(results, status){
      if(status == "OK" && results.length == 1){
        console.log(results)
      }
      else{
        ;
      }
    })
  }

  startEl.onchange = changeFunction
  endEl.onchange = changeFunction
}

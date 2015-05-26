document.addEventListener("DOMContentLoaded", function(event){ 
  var head = document.getElementsByTagName('head')[0]
   var script = document.createElement('script')
   script.type = 'text/javascript'
   script.src = "https://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0&s=1&onscriptload=initialize"
   head.appendChild(script)
})

window.initialize = function(){
  setInterval(function(){
    chrome.storage.sync.get(['start', 'end'], function(items){
      if(items['start'] && items['end']){
        var start = items['start']
        var end = items['end']

        console.log(start)
      }
    })
  }, 5000) // 5 minutes
}

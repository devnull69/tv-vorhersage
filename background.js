var options = [];

var anzahl = 0;
var lastUpdated = null;

$(document).ready(function() {
   update();
   window.setInterval(function() {
      // Update nach 5 Minuten
      update();
   }, 5 * 60 * 1000);
});

function update() {
   anzahl = 0;
   chrome.browserAction.setBadgeText({text: ""});
   chrome.storage.sync.get('options', function(items) {
      if(!chrome.runtime.lastError && items.options) {
         options = JSON.parse(items.options);
         for(i=0; i<options.length; i++) {
            options[i].ergebnis = "-";
            sendRequest(i, 0);
         }
      }
   });
}

function sendRequest(i, pagenumber) {
   var addpath = "";
   if(pagenumber>0)
      addpath = "/" + pagenumber;
   $.ajax({
      url: "http://www.fernsehserien.de/" + options[i].pfad + "/sendetermine" + addpath,
      type: "GET",
      dataType: "html",
      success: callback(i, pagenumber)
   });
}

function callback(idx, pagenumber) {
   return function(data) {
      var $response = $(data);
      var $senderows = $response.find(".sendetermine tr");
      var gefunden = false;
      if($senderows.length>0)
         options[idx].ergebnis = "";
      $senderows.each(function() {
         if(!$(this).hasClass("only-smartphone")) {
            var sender = $(this).find('td').eq(3).text();
            var datum = $(this).find('td').eq(1).text();
            var staffelMatch = $(this).find('td').eq(7).text().match(/^(\d+)\./);
            var staffel = "";
            if(staffelMatch)
               staffel = staffelMatch[1];
            var episode = $(this).find('td').eq(8).text();
            if((sender==options[idx].sender || options[idx].sender == "") && staffel==options[idx].staffel && episode==options[idx].episode && !gefunden) {
               options[idx].ergebnis = datum;
               options[idx].sender = sender;
               anzahl++;
               gefunden=true;
               chrome.browserAction.setBadgeText({text: anzahl.toString()});
            }
         }
      });
      if(!gefunden) {
         // weitere Seite?
         var weitereSeite = ($response.find('.nav-right').eq(0).find('a').length > 0) ? true : false;
         if(weitereSeite)
            sendRequest(idx, pagenumber+1);
      }
      lastUpdated = new Date();
   }
}
var options = [];

var anzahl = 0;
var lastUpdated = null;

$(document).ready(function() {
   update();
   window.setInterval(function() {
      // Update nach 15 Minuten
      update();
   }, 15 * 60 * 1000);
});

function update() {
   anzahl = 0;
   chrome.browserAction.setBadgeText({text: ""});
   chrome.storage.sync.get('options', function(items) {
      if(!chrome.runtime.lastError && items.options) {
         options = JSON.parse(items.options);
         for(i=0; i<options.length; i++) {
            options[i].ergebnis = "-";
            if(!options[i].aktiv || options[i].aktiv == "1") sendRequest(i, 0);
         }
      }
   });
}

function sendRequest(i, pagenumber) {
   var addpath = "";
   if(pagenumber>0)
      addpath = "/" + pagenumber;

   console.log("https://www.fernsehserien.de/" + options[i].pfad + "/sendetermine" + addpath + "?t=" + (new Date()).getTime());

   $.ajax({
      url: "https://www.fernsehserien.de/" + options[i].pfad + "/sendetermine" + addpath + "?t=" + (new Date()).getTime(),
      type: "GET",
      dataType: "text",
      success: callback(i, pagenumber),
      error: function(xhr) {
         if(xhr.status == 404)
            options[i].ergebnis = "n.v.";
      }
   });
}

function callback(idx, pagenumber) {
   return function(data) {
		data = removeInline(data);
      var $response = $(data);
      var $senderows = $response.find(".sendetermine tr");
      var gefunden = false;
      if($senderows.length>0)
         options[idx].ergebnis = "";
      $senderows.each(function() {
         if(!$(this).hasClass("only-smartphone")) {
            var $senderTags = $(this).find('td').eq(4).children();
            var sender = $(this).find('td').eq(4).text();
            var datum = $(this).find('td').eq(2).text();
            var staffelMatch = $(this).find('td').eq(8).text().match(/^(\d+)\./);
            var staffel = "";
            if(staffelMatch)
               staffel = staffelMatch[1];
            var episode = $(this).find('td').eq(9).text();
            if(staffel==options[idx].staffel && episode==options[idx].episode && !gefunden) {
               if(sender!=options[idx].sender && options[idx].sender != "") {
                  var senderTag = $senderTags.eq(0)[0];
                  if(senderTag.tagName == "ABBR")
                     sender = senderTag.title;
               }
               if(sender==options[idx].sender || options[idx].sender == "") {
                  options[idx].ergebnis = datum;
                  options[idx].sender = sender;
                  anzahl++;
                  gefunden=true;
                  chrome.browserAction.setBadgeBackgroundColor({color: "#FF0000"});
                  chrome.browserAction.setBadgeText({text: anzahl.toString()});
               }
            }
         }
      });
      if(!gefunden) {
         // weitere Seite?
         var weitereSeite = ($response.find('.rechts').eq(0).find('a').length > 0) ? true : false;
         if(weitereSeite)
            sendRequest(idx, pagenumber+1);
      }
      lastUpdated = new Date();
   }
}

function removeInline(theHTML) {
   theHTML = theHTML.replace(/onclick=\"[^\"]*\"/g, '');
   theHTML = theHTML.replace(/onchange=\"[^\"]*\"/g, '');
   theHTML = theHTML.replace(/onsubmit=\"[^\"]*\"/g, '');
   theHTML = theHTML.replace(/onmouseover=\"[^\"]*\"/g, '');
   theHTML = theHTML.replace(/onmouseout=\"[^\"]*\"/g, '');
   theHTML = theHTML.replace(/onerror=\"[^\"]*\"/g, '');
   theHTML = theHTML.replace(/onload=\"[^\"]*\"/g, '');
	return theHTML;
}
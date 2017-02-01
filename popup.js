var bgPage = chrome.extension.getBackgroundPage();
var options = bgPage.options;

var theHTML = "";
var headingHTML = "";
var anzahl = 0;

for(i=0; i<options.length; i++) {
   if(i==0) {
      headingHTML = '<tr><th>Serie</th><th>St</th><th>Ep</th><th>Sender</th><th>Datum</th></tr>';
   }
	if(!options[i].aktiv || options[i].aktiv == "1") {
		theHTML += '<tr><td width="100" class="titel"><a class="clickme" href="https://www.fernsehserien.de/' + options[i].pfad + '/sendetermine">' + options[i].name + '</a></td><td>' + options[i].staffel + '</td><td>' + options[i].episode + '</td><td>' + options[i].sender + '</td>';
		if(options[i].ergebnis == "") {
			theHTML += '<td></td>';
		} else if(options[i].ergebnis == "-"){
			theHTML += '<td class="rot">Fehler</td>';
		} else if(options[i].ergebnis == "n.v."){
			theHTML += '<td>' + options[i].ergebnis + '</td>';
			anzahl++;
		} else {
			theHTML += '<td class="gruen">' + options[i].ergebnis + '</td>';
			anzahl++;
		}
		theHTML += "</tr>";
	}
}

$(document).ready(function() {
   $('#heading').html(headingHTML);
   $('#liste').html(theHTML);
   if(theHTML != "")
      $('body').append('<hr/>');
   $('body').append('<input type="button" value="Optionen" id="options" />');
   if(theHTML != "")
      $('body').append('<input type="button" value="Aktualisieren" id="update" />');
   if(bgPage.lastUpdated)
      $('body').append('<span>Letzte Aktualisierung: ' + getDatumUhrzeit(bgPage.lastUpdated) + '</span>');
   $('#options').click(function(){
      chrome.tabs.create({url:"options.html"});
   });
   $('#update').click(function() {
      bgPage.update();
      window.close();
   });
   
   $('.clickme').click(function() {
      chrome.tabs.create({url: $(this).attr('href')});
   });
});

function getDatumUhrzeit(date) {
   var day = date.getDate();
   var month = date.getMonth()+1;
   var year = date.getFullYear();
   
   var hour = zweistellig(date.getHours());
   var minute = zweistellig(date.getMinutes());
   var second = zweistellig(date.getSeconds());
   
   return day + "." + month + "." + year + " " + hour + ":" + minute + ":" + second;
}

function zweistellig(wert) {
   return wert<10 ? "0"+wert : wert.toString();
}
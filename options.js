var bgPage = chrome.extension.getBackgroundPage();

window.addEventListener('load', function() {
   document.getElementById('save').addEventListener('click', function() {
      save();
   });
   document.getElementById('cancel').addEventListener('click', function() {
      window.close();
   });
   document.getElementById('addentry').addEventListener('click', function() {
      addEntry();
   });
   
   getOptionsFromLocalStorage();

   $('#popupclose').click(function() {
      $("#suchergebnisse").empty();
      $("#popupbox").hide();
   });
   
}, false);

function addEntry() {
   var theTableBody = document.getElementById('liste');
   var newTR = document.createElement('tr');
   newTR.innerHTML = '<tr>' +
      '<td>Serie:</td><td><input type="text" size="30" class="serienname" value=""/></td>' +
      '<td>Pfad:</td><td><input type="text" size="30" class="pfad" value=""/></td>' +
      '<td>Staffel:</td><td><input type="text" size="3" class="staffel" value=""/></td>' +
      '<td>Episode:</td><td><input type="text" size="3" class="episode" value=""/></td>' +
      '<td>Sender:</td><td><select class="sender"></select></td>' +
		'<td><label><input type="checkbox" class="aktiv" checked/>Aktiv</label></td>' +
      '<td><input type="button" value="Zeile löschen" class="delentry"/></td>' +
      '</tr>\n';
   theTableBody.appendChild(newTR);
   addEventListeners();
}

function clickHandler(innerI) {
   return function() {
      var theTR = document.getElementsByTagName('tr');
      theTR[innerI].parentNode.removeChild(theTR[innerI]);
      addEventListeners();
   }
}

function changeHandler(innerI) {
   return function() {
      var serienname = document.getElementsByClassName('serienname')[innerI].value;
      serienname = serienname.replace(/ä/g, "ae");
      serienname = serienname.replace(/ö/g, "oe");
      serienname = serienname.replace(/ü/g, "ue");
      serienname = serienname.replace(/ß/g, "ss");
      serienname = serienname.replace(/Ä/g, "Ae");
      serienname = serienname.replace(/Ö/g, "Oe");
      serienname = serienname.replace(/Ü/g, "Ue");
      serienname = serienname.replace(/\s/g, "-");
      serienname = serienname.replace(/\'/g, "");
      serienname = serienname.toLowerCase();
      //console.log(serienname);
      
      requestSerienname(innerI, serienname);
   }
}

function trim(theText) {
   return theText.replace(/^\s+|\s+$/g, "");
}

function requestSerienname(innerI, serienname, optionalArg) {
   $('.pfad').eq(innerI).parent().find('img').remove();
   optionalArg = (typeof optionalArg === "undefined") ? "" : optionalArg;
   var pfad = document.getElementsByClassName('pfad')[innerI];
   var sender = document.getElementsByClassName('sender')[innerI];
   
   if (sender.nodeName.toUpperCase() == "INPUT") {
      var elternTD = sender.parentNode;
      elternTD.innerHTML = "";
      var newSelect = document.createElement('select');
      newSelect.className = "sender";
      elternTD.appendChild(newSelect);
      sender = newSelect;
   }
   // Change-Handler vom Pfad ausschalten
   pfad.onchange = null;
   //console.log('Pfadhandler entfernt');
   
   var xmlhttp = new XMLHttpRequest();
   xmlhttp.open('GET', 'https://www.fernsehserien.de/' + serienname, true);
   xmlhttp.onreadystatechange = function() {
      if(xmlhttp.readyState == 4) {
         hideLoader();
         if(xmlhttp.status == 200 || xmlhttp.status == 302) {
            sender.innerHTML = "";
            pfad.value = serienname;
            //console.log('Pfad verändert');
            pfad.parentNode.style.border = '3px solid lightgreen';
            $(pfad.parentNode).animate({
               borderWidth: "0"
            }, 1000, function() {
               pfad.parentNode.style.border = '';
            });
            getSenderliste(sender, serienname, optionalArg);
         } else
            if(xmlhttp.status == 404) {
               pfad.value = "";
               //console.log('Pfad verändert');
               pfad.parentNode.style.border = '3px solid red';
               // Options aus Sender-Select entfernen
               sender.innerHTML = "";
               
               // Lupe hinzufuegen
               var newImage = document.createElement('img');
               newImage.className = "linked";
               newImage.src = "lupe.gif";
               newImage.border = "0";
               newImage.title = "Serie suchen";
               pfad.parentNode.appendChild(newImage);
               
               newImage.addEventListener('click', function(e) {
                  sucheSerie(innerI);
               }, false);
         }
         pfad.onchange = changeHandlerPfad(innerI);
         //console.log('Pfadhandler hinzugefügt');
      }
   }
   showLoader();
   xmlhttp.send();
}

function getSenderliste(sender, serienname, optionalArg) {

   var xmlhttp = new XMLHttpRequest();
   xmlhttp.open('GET', 'https://www.fernsehserien.de/' + serienname + "/sendetermine?t=" + (new Date()).getTime(), true);
   xmlhttp.onreadystatechange = function() {
      if(xmlhttp.readyState == 4) {
         hideLoader();
         if(xmlhttp.status == 200 || xmlhttp.status == 302) {
            var $resultat = $(xmlhttp.responseText);
            var $senderliste = $resultat.find('#sendetermine-select-sender option');
            $senderliste.each(function() {
               var newOption = document.createElement('option');
               var sendertext = $(this).text();
               if(trim(sendertext) == "alle Sender") {
                  newOption.value = "";
               } else {
                  newOption.value = sendertext;
               }
               newOption.innerHTML = $(this).text();
               sender.appendChild(newOption);
               sender.value = optionalArg;
            });
         }
      }
   };
   xmlhttp.send();
}

function sucheSerie(innerI) {
   var serienname = encodeURIComponent(document.getElementsByClassName('serienname')[innerI].value);
   var pfad = document.getElementsByClassName('pfad')[innerI];
   console.log("https://www.fernsehserien.de/suche/" + serienname);
   $.ajax({
      url: "https://www.fernsehserien.de/suche/" + serienname,
      type: "GET",
      dataType: "html",
      success: function(data) {
         $result = $(data);
         $suchergebnisse = $result.find('li.suchergebnis').parent();
         if($suchergebnisse.length) {
            $("#suchergebnisse").html('<h3>Bitte wählen Sie:</h3>').append($suchergebnisse);
            $("#popupbox").show();
            $("#popupbox").css({
               left: $(pfad).position().left + "px",
               top: $(pfad).position().top+24 + "px"
            });
            $("#suchergebnisse a").click(function(e) {
               var chosenPfad = $(this).attr("href").substring(1);
               $("#suchergebnisse").empty();
               $("#popupbox").hide();
               pfad.value = chosenPfad;
               requestSerienname(innerI, chosenPfad);
               e.preventDefault();
               e.stopPropagation();
            });
         } else {
            // schon gefunden?
            var $largeImgLink = $result.find('.serie-image-large-inner a');
            console.log($largeImgLink.html());
            if($largeImgLink.length>0) {
               pfad.value = $largeImgLink.attr('href');
               requestSerienname(innerI, pfad.value);
            }
         }
      }
   });
}

function showLoader() {
   document.getElementById("overlay").style.display = "";
}

function hideLoader() {
   document.getElementById("overlay").style.display = "none";
}

function clickHandlerImg(innerI) {
   var pfad = document.getElementsByClassName("pfad")[innerI];
   var sender = document.getElementsByClassName("sender")[innerI];
   return function() {
      requestSerienname(innerI, pfad.value, sender.value);
   };
}

function changeHandlerPfad(innerI) {
   return function() {
      console.log('Pfadchangehandler ausgeführt');
      var pfad = document.getElementsByClassName('pfad')[innerI];
      pfad.parentNode.style.border = "";
      
      requestSerienname(innerI, pfad.value);
   }
}

function blurHandlerPfad(innerI) {
   return function() {
      console.log('Pfadblurhandler ausgeführt');
      var pfad = document.getElementsByClassName('pfad')[innerI];
      pfad.parentNode.style.border = "";
   }
}

function addEventListeners() {
   var theDelButtons = document.getElementsByClassName('delentry');
   for(i=0; i<theDelButtons.length; i++) {
      theDelButtons[i].onclick = clickHandler(i);
   }
   
   var theSeriennamen = document.getElementsByClassName('serienname');
   for(i=0; i<theSeriennamen.length; i++) {
      theSeriennamen[i].onchange = changeHandler(i);
   }

   var thePfade = document.getElementsByClassName('pfad');
   for(i=0; i<thePfade.length; i++) {
      thePfade[i].onchange = changeHandlerPfad(i);
      //thePfade[i].onblur = blurHandlerPfad(i);
   }
   //console.log('Alle Pfadhandler hinzugefügt');
   
   var theRefreshs = document.getElementsByClassName('refresh');
   for(i=0; i<theRefreshs.length; i++) {
      theRefreshs[i].onclick = clickHandlerImg(i);
   }
   
}

function save() {
   try {
      var theSeriennamen = document.getElementsByClassName('serienname');
      var thePfade = document.getElementsByClassName('pfad');
      var theStaffeln = document.getElementsByClassName('staffel');
      var theEpisoden = document.getElementsByClassName('episode');
      var theSender = document.getElementsByClassName('sender');
      var theAktiv = document.getElementsByClassName('aktiv');
		
      var options = [];
      for(i=0; i<theSeriennamen.length; i++) {
         if(theSeriennamen[i].value != "" && thePfade[i].value != "" && theEpisoden[i].value != "") {
            options[i] = {};
            options[i].name = theSeriennamen[i].value;
            options[i].pfad = thePfade[i].value;
            options[i].staffel = theStaffeln[i].value;
            options[i].episode = theEpisoden[i].value;
            options[i].sender = theSender[i].value;
            options[i].ergebnis = "";
				options[i].aktiv = theAktiv[i].checked ? "1" : "0";
         }
      }
      chrome.storage.sync.set({'options': JSON.stringify(options)});
      bgPage.update();
      window.close();
   } catch(e) {
   }
}

function getOptionsFromLocalStorage() {
   chrome.storage.sync.get('options', function(items) {
      if(items.options) {
         var options = JSON.parse(items.options);

         var theTableBody = document.getElementById('liste');
         var theHTML = "";

         for(i=0; i<options.length; i++) {
				var theCheckbox = "";
            theHTML += '<tr>';
            theHTML += '<td>Serie:</td><td><input type="text" size="30" class="serienname" value="' + options[i].name + '"/></td>';
            theHTML += '<td>Pfad:</td><td><input type="text" size="30" class="pfad" value="' + options[i].pfad + '"/></td>';
            theHTML += '<td>Staffel:</td><td><input type="text" size="3" class="staffel" value="' + options[i].staffel + '"/></td>';
            theHTML += '<td>Episode:</td><td><input type="text" size="3" class="episode" value="' + options[i].episode + '"/></td>';
            theHTML += '<td>Sender:</td><td><input type="text" size="15" class="sender" value="' + options[i].sender + '"/><img title="Senderliste aktualisieren" style="cursor: pointer;" class="refresh" border="0" src="refresh.png" /></td>';
				if(!options[i].aktiv || options[i].aktiv == "1") theCheckbox = " checked";
				theHTML += '<td><label><input type="checkbox" class="aktiv" ' + theCheckbox + '/>Aktiv</label></td>';
            theHTML += '<td><input type="button" value="Zeile löschen" class="delentry"/></td>';
            theHTML += '</tr>\n';
         }
         theTableBody.innerHTML = theHTML;
         addEventListeners();
      }
   });
}
var UI = require('ui');
var ajax = require('ajax');
var Accel = require('ui/accel');
var Vibe = require('ui/vibe');

var stopID = "";

var setStopID = function (id) {
  stopID = id;
};

var getStopID = function () {
  return stopID;
};

var getTimeDifferenceFromNow = function (date) {
  "use strict";

  var timeDiff = (date.getTime() - new Date().getTime()) / 1000; //in seconds
  return Math.floor(timeDiff);
};

var getTimeDifferenceDeviation = function (expectedTime, aimedTime) {
  "use strict";

  var minDiff = (expectedTime.getTime() - aimedTime.getTime()) / 60 / 1000; //in minutes

  if (minDiff < 0) {
    minDiff = 0;
  }

  return Math.floor(minDiff);
};

//Fix displaying minutes
var fixTimeLowerThanTen = function (time) {
  'use strict';

  if (time < 10) {
    time = "0" + time;
  }
  return time;
};

var timeCheck = function (time, expected) {
  "use strict";
  if (time <= 44) {
    time = "nå";
  } if (45 <= time && time <= 104) {
    time = "1 min";
  } else if (105 <= time && time <= 164) {
    time = "2 min";
  } else if (165 <= time && time <= 224) {
    time = "3 min";
  } else if (225 <= time && time <= 284) {
    time = "4 min";
  } else if (285 <= time && time <= 344) {
    time = "5 min";
  } else if (345 <= time && time <= 404) {
    time = "6 min";
  } else if (405 <= time && time <= 464) {
    time = "7 min";
  } else if (465 <= time && time <= 524) {
    time = "8 min";
  } else if (525 <= time && time <= 584) {
    time = "9 min";
  } else if (585 <= time) {
    time = fixTimeLowerThanTen(expected.getUTCHours() + 1) + ":" + fixTimeLowerThanTen(expected.getUTCMinutes());
  }
  return time;
};

//Remove Æ,Ø,Å
var replaceSpecialChar = function (input) {
  input = input.replace(/æ/g , "ae");
  input = input.replace(/Æ/g , "AE");
  input = input.replace(/ø/g , "o");
  input = input.replace(/Ø/g , "O");
  input = input.replace(/å/g , "a");
  input = input.replace(/Å/g , "A");

  return input;
};

var parseFeed = function (data, quantity) {
  var items = [];

  if (data.length < quantity){
    quantity = data.length;
  }

  for(var i = 0; i < quantity; i++) {

    // Get date/time substring

    var transportNr = data[i].LineRef;

    var transportDest = data[i].DestinationDisplay;

    transportDest = replaceSpecialChar(transportDest);

    transportDest = transportDest.charAt(0).toUpperCase() + transportDest.substring(1);

    var title = transportNr + " " + transportDest;

    var time = getTimeDifferenceFromNow(new Date(parseInt(data[i].ExpectedArrivalTime.substr(6))));

    time = timeCheck(time, new Date(parseInt(data[i].ExpectedArrivalTime.substr(6))));

    // Add to menu items array
    items.push({
      title: title,
      subtitle: time,
      data: {
        destination: data[i].DestinationDisplay,
        transportType: data[i].VehicleMode,
        aimedTime: data[i].AimedArrivalTime,
        expectedTime: data[i].ExpectedArrivalTime,
        line: data[i].LineRef,
        platform: data[i].DeparturePlatformName,
      }
    });
  }

  return items;
};


//Start app
var splashCard = new UI.Card({
  title: " ",
  subtitle: " ",
  body: " ", 
  banner: 'images/logo_ruter_bw.png'
});

splashCard.show();



var stopMenu = new UI.Menu({
  sections: [{
    title: 'Holdeplasser',
    items: [
      {
      title: 'IT Fornebu',
      subtitle: 'Buss',
      data: {
        stopId: '2190018'
      }
    },{
      title: 'Jernbanetorget',
      subtitle: 'T-bane',
      data: {
        stopId: '3010011'
      }
    }, {
      title: 'Lysaker brygge',
      subtitle: 'Buss',
      data: {
        stopId: '3012554'
      }
    },{
      title: 'Lysaker stasjon (nordside Dr.vn)',
      subtitle: 'Buss',
      data: {
        stopId: '3012551'
      }
    },{
      title: 'Majorstuen',
      subtitle:'T-bane',
      data: {
        stopId: '3010200'
      }
    },{
      title: 'Nationaltheatret',
      subtitle: 'T-bane',
      data: {
        stopId: '3010031'    
      }
    },{
      title: 'Nycoveien',
      subtitle: 'Buss',
      data: {
        stopId: '3010447'
      }
    },{
      title: 'Nydalen',
      subtitle: 'T-bane',
      data: {
        stopId: '3012130'
      }
    },{
      title: 'Nydalen stasjon',
      subtitle: 'Buss',
      data: {
        stopId: '3012126'
      }
    },{
      title: 'Nydalen T',
      subtitle: 'Buss',
      data: {
        stopId: '3012131'
      }
    },{
      title: 'Sannergata',
      subtitle: 'Buss',
      data: {
        stopId: '3010521'
      }
    },{
      title: 'Storo (pa brua)',
      subtitle: 'Trikk, Buss',
      data: {
        stopId: '3012121'
      }
    },{
      title: 'Stortinget [T-bane]',
      subtitle: 'T-bane',
      data: {
        stopId: '3010020'
      }
    },{
      title: 'Ulleval stadion (Ringveien)',
      subtitle: 'Buss',
      data: {
        stopId: '3012212'
      }
    },{
      title: 'Ulleval stadion [T-bane]',
      subtitle: 'T-bane',
      data: {
        stopId: '3012210'
      }
    }]
  }]
});

stopMenu.on('select', function(e) {
  // Make request to reis.trafikanten.no
  var stopId = e.item.data.stopId;
  setStopID(stopId);

  ajax(
    {
      url:'http://reis.trafikanten.no/ReisRest/RealTime/GetRealTimeData/' + stopId,
      type:'json'
    },
    function(data) {
      // Create an array of Menu items
      var menuItems = parseFeed(data, 10);

      // Construct Menu to show to user
      var resultsMenu = new UI.Menu({
        sections: [{
          title: e.item.title,
          items: menuItems,
          data: {
            stopId: stopId
          }
        }]
      });

      // Add an action for SELECT
      resultsMenu.on('select', function(e) {

        var transportType = e.item.data.transportType;

        switch(transportType) {
          case 0:
            transportType = "Buss";
            break;
          case 1:
            transportType = "Ferje";        
            break;
          case 2:
            transportType = "Tog";        
            break;
          case 3:
            transportType = "Trikk";        
            break;
          case 4:
            transportType = "T-bane";        
            break;
          default:
            transportType = "Udefinert";
        }

        var subtitleDest = e.item.data.destination;
        subtitleDest = subtitleDest.charAt(0).toUpperCase() + subtitleDest.substring(1);

        if (subtitleDest.length > 12) {
          subtitleDest = subtitleDest.substring(0, 12);
        }

        var titleLine = e.item.data.line;

        var content = '\nForventet tid: ' + timeCheck(getTimeDifferenceFromNow(new Date(parseInt(e.item.data.expectedTime.substr(6)))), new Date(parseInt(e.item.data.expectedTime.substr(6)))) +
            '\nForsinkelse: ' + getTimeDifferenceDeviation(new Date(parseInt(e.item.data.expectedTime.substr(6))), new Date(parseInt(e.item.data.aimedTime.substr(6)))) + " min" + 
            '\nTransport type: ' + transportType +
            '\nPlatform: ' + e.item.data.platform;

        // Create the Card for detailed view
        var detailCard = new UI.Card({
          title: titleLine,
          subtitle: subtitleDest,
          body: content
        });
        detailCard.show();
      });

      // Show the Menu, hide the splash
      resultsMenu.show();

      // Register for 'tap' events
      resultsMenu.on('accelTap', function(e) {

        var stopId = getStopID();

        // Make another request        
        ajax(
          {
            url:'http://reis.trafikanten.no/ReisRest/RealTime/GetRealTimeData/' + stopId,
            type:'json'
          },
          function(data) {
            // Create an array of Menu items
            var newItems = parseFeed(data, 10);

            // Update the Menu's first section
            resultsMenu.items(0, newItems);

            // Notify the user
            Vibe.vibrate('short');
          },
          function(error) {
            console.log('Download failed: ' + error);
            var errorCard = new UI.Card({
              title: "Error",
              body: "Beklager, kunne ikke laste inn data"
            }); 
            errorCard.show();

          }
        );
      }); 
    },
    function(error) {
      console.log("Download failed: " + error);
      var errorCard = new UI.Card({
        title: "Error",
        body: "Beklager, kunne ikke laste inn data"
      }); 
      errorCard.show();
    }
  );

  // Prepare the accelerometer
  Accel.init();
});

setTimeout(function() {
  stopMenu.show();
  splashCard.hide();
}, 1000);

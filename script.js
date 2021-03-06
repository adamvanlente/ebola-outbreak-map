var ebolaMap = {

    // Data Source
    dataUrl: 'https://www.googleapis.com/mapsengine/' +
        'v1/tables/04616881874294944172-05039038523903420493/' +
        'features?key=AIzaSyC9ZH9TiysgRkspUPRt2JiE459pKkXrOLM' +
        '&version=published&maxResults=1000',

    currentIndex: 0,
    boundsArray: [],

    // Load and store data.
    loadData: function() {
      $.ajax({
        url: this.dataUrl,
        cache: false,
        success: function(mapData){
          ebolaMap.features = mapData.features;
        }
      });
    },

    // Set the map.
    loadMap: function() {
      this.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 6,
        center: new google.maps.LatLng(12.254128 , -1.538086),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [{
          stylers: [{
            saturation: -80
          }]}, {
          featureType: 'poi.park',
          stylers: [{
            visibility: 'off'
          }]
        }],
        disableDefaultUI: true
      });
      this.setHeatmap();
      this.loadData();
    },

    // Initialize a heatmap that will grow.
    setHeatmap: function() {
      this.heatmapData = new google.maps.MVCArray();
      this.heatmap = new google.maps.visualization.HeatmapLayer({
                map: this.map,
                data: this.heatmapData,
                radius: 12,
                dissipate: false,
                maxIntensity: 3,
                gradient: [
                    'rgba(213, 102, 102, 0.2)',
                    'rgba(213, 102, 102, 0.5)',
                    'rgb(213, 102, 102)'
                ]
            });
    },

    // Play/pause the timelapse.
    playOrPause: function() {
      if (!this.features) {
          var msg = 'Data is not yet loaded.';
          this.setMsg(msg);
      } else {

        if (this.isPlaying) {
          this.isPlaying = false;
          $('#control-icon').attr('class', 'fa fa-play');
          window.clearInterval(this.pinInterval);
        } else {
          $('#control-icon').attr('class', 'fa fa-pause');
          this.placePinsOnMap();
        }
      }
    },

    // Place pins on the map for each Ebola case.
    placePinsOnMap: function() {

      this.isPlaying = true;

      if (ebolaMap.features[ebolaMap.currentIndex]) {
        var item = ebolaMap.features[ebolaMap.currentIndex];
        var coords = item.geometry.coordinates;
        var lat = coords[1];
        var lon = coords[0];

        ebolaMap.heatmapData.push(new google.maps.LatLng(lat, lon));

        ebolaMap.setDateOnScreen(item);

        ebolaMap.addIncidentPin(lat, lon);

        ebolaMap.setCurrentBounds(lat, lon);
        ebolaMap.currentIndex++;

        if (ebolaMap.currentIndex < ebolaMap.features.length) {
          ebolaMap.pinInterval = setTimeout(ebolaMap.placePinsOnMap, 300);
        }
      }
    },

    // Add coordinates and reset the viewport.
    setCurrentBounds: function(lat, lon) {
      var mapPoint = new google.maps.LatLng(lat, lon);
      this.boundsArray.push(mapPoint);

      this.startBoundsSetter();
    },

    // Only set the bounds from time to time, so its not so shaky.
    startBoundsSetter: function() {
      setTimeout(function() {
        var bounds = new google.maps.LatLngBounds;
        ebolaMap.boundsArray.forEach(function(latlng) {
          bounds.extend(latlng);
        });
        ebolaMap.map.fitBounds(bounds);
      }, 500);
    },

    // Set/update the current date of the pin being placed.
    setDateOnScreen: function(item) {
      var itemDate = item.properties.Date;
      var ogYear = itemDate.substr(0, 4);
      var ogMonth = itemDate.substr(4, 2);
      var ogDay = itemDate.substr(6, 2);

      ogMonth = parseInt(ogMonth) - 1;

      var date = new Date(ogYear, ogMonth, ogDay);
      var dateArray = String(date).split(' ');

      var newYear = dateArray[3];
      var newMonth = dateArray[1];
      var newDay = dateArray[2];

      $('#date').show();
      $('#year').html(newYear);
      $('#month').html(newMonth);
      $('#day').html(newDay);

    },

    // Add a pin for an incident.  Give the pin an animation effect.
    addIncidentPin: function(lat, lon) {
        var location = new google.maps.LatLng(lat, lon);

        var outer = new google.maps.Marker({
          position: location,
          clickable: false,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillOpacity: 0.5,
            fillColor: 'rgb(213, 102, 102)',
            strokeOpacity: 1.0,
            strokeColor: 'rgb(213, 102, 102)',
            strokeWeight: 1.0,
            scale: 0,
          },
          optimized: false,
          zIndex: this.currentIndex,
          map: this.map
        });

        var inner = new google.maps.Marker({
          position: location,
          clickable: false,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillOpacity: 1.0,
            fillColor: 'rgb(213, 102, 102)',
            strokeWeight: 0,
            scale: 0
          },
          optimized: false,
          zIndex: ebolaMap.currentIndex
        });

        for (var i = 0; i <= 10; i++) {
          setTimeout(this.setScale(inner, outer, i / 10), i * 60);
        }
    },

    // Scale a pin to give it an animated appearance.
    setScale: function(inner, outer, scale) {
      return function() {
        if (scale == 1) {
          outer.setMap(null);
        } else {
          var icono = outer.get('icon');
          icono.strokeOpacity = Math.cos((Math.PI/2) * scale);
          icono.fillOpacity = icono.strokeOpacity * 0.5;
          icono.scale = Math.sin((Math.PI/2) * scale) * 15;
          outer.set('icon', icono);

          var iconi = inner.get('icon');
          var newScale = (icono.scale < 2.0 ? 0.0 : 2.0);
          if (iconi.scale != newScale) {
            iconi.scale = newScale;
            inner.set('icon', iconi);
            if (!inner.getMap()) inner.setMap(ebolaMap.map);
          }
        }
      }
    },

    // Set a message for the user.
    setMsg: function(msg) {
      $('#message').html(msg);
      setTimeout(function() {
        $('#message').html('');
      }, 1500);
    }
};

// Load map & data.
ebolaMap.loadMap();

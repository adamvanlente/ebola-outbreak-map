var ebolaMap = {

    dataUrl: 'https://www.googleapis.com/mapsengine/v1/tables/' +
        '04616881874294944172-01677512005004143246/features?key=' +
        'AIzaSyC9ZH9TiysgRkspUPRt2JiE459pKkXrOLM&version=' +
        'published&maxResults=1000',

    currentIndex: 0,
    boundsArray: [],

    // Load and store data.
    loadData: function() {
      $.ajax({
        url: this.dataUrl,
        cache: false,
        success: function(mapData){

          var items = mapData.features;

          items.sort(function(a,b) {
            // assuming distance is always a valid integer
            return parseInt(a.properties.Date,10) - parseInt(b.properties.Date,10);
          });

          ebolaMap.features = items;
        }
      });
    },

    // Set the map.
    loadMap: function() {

      if (window.google) {
        this.map = new google.maps.Map(document.getElementById('map'), {
          zoom: 4,
          center: new google.maps.LatLng(10, -10),
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
      } else {

        L.mapbox.accessToken = 'pk.eyJ1IjoiYWRhbXZhbmxlbnRlIiwiYSI6Ik8xUDRBczAifQ.0TeqMkP0SGcvepgzYiSsHA';
        this.mapboxMap = L.mapbox.map('map', 'adamvanlente.jpobma50');
        ebolaMap.heatLayer = L.heatLayer([], {maxZoom: 18}).addTo(this.mapboxMap);
      }

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

      var features = ebolaMap.features;

      features.sort(function(a,b) {
        return
            parseInt(a.properties.Date,10) - parseInt(b.properties.Date,10);
      });

      if (features[ebolaMap.currentIndex]) {
        var item = features[ebolaMap.currentIndex];

        var coords = item.geometry.coordinates;
        var lat = coords[1];
        var lon = coords[0];

        var cat = item.properties.Category;
        var val = item.properties.Value;
        if (cat == 'Deaths') {
          console.log(val);
        }

        // var counterText =
        //     'case: ' + ebolaMap.currentIndex;
        // $('#count').html(counterText);
        ebolaMap.heatmapData.push(new google.maps.LatLng(lat, lon));

        ebolaMap.addIncidentPin(lat, lon);

        ebolaMap.setDateOnScreen(item);

        ebolaMap.currentIndex++;

        if (ebolaMap.currentIndex < ebolaMap.features.length - 1) {
          ebolaMap.pinInterval = setTimeout(ebolaMap.placePinsOnMap, 1);
        }
      }
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

    // Add coordinates and reset the viewport.
    setCurrentBounds: function(lat, lon) {

      var mapPoint = new google.maps.LatLng(lat, lon);
      this.boundsArray.push(mapPoint);

      var bounds = new google.maps.LatLngBounds;
      ebolaMap.boundsArray.forEach(function(latlng) {
        bounds.extend(latlng);
      });
      ebolaMap.map.fitBounds(bounds);

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

    playPauseMapbox: function() {

      if (ebolaMap.features) {

        if (ebolaMap.isPlaying) {
          ebolaMap.isPlaying = false;
          $('#play-button').attr('class', 'fa fa-play');
          window.clearInterval(ebolaMap.pinInterval)
        } else {
          $('#play-button').attr('class', 'fa fa-pause');
          this.setMapboxMarkers();
        }


      } else {
        var msg = 'Data is not yet loaded.';
        this.setMsg(msg);
      }

    },

    setMapboxMarkers: function() {

      this.isPlaying = true;

      var features = ebolaMap.features;

      features.sort(function(a,b) {
        return
            parseInt(a.properties.Date,10) - parseInt(b.properties.Date,10);
      });

      if (features[ebolaMap.currentIndex]) {
        var item = features[ebolaMap.currentIndex];

        ebolaMap.setDateOnScreen(item);

        var coords = item.geometry.coordinates;
        var lat = coords[1];
        var lon = coords[0];

        ebolaMap.heatLayer.addLatLng([lat, lon]);

        var cat = item.properties.Category;
        var val = item.properties.Value;

        var marker = L.circleMarker(new L.LatLng(lat, lon), {
          'stroke': true,
          'weight': 3,
          'opacity': 0.5,
          'color': '#000',
          'fillColor': '#000'
        });

        marker.addTo(ebolaMap.mapboxMap);

        ebolaMap.updateMapboxMarker(marker);

        ebolaMap.currentIndex++;

        if (ebolaMap.currentIndex < ebolaMap.features.length - 1) {
          ebolaMap.pinInterval = setTimeout(ebolaMap.setMapboxMarkers, 1);
        }
      }
    },

    updateMapboxMarker: function(marker) {
      setTimeout(function() {
      marker.setStyle({
        'fillColor':'#f86767',
        'opacity': 0
      });
    }, 200)

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

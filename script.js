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
        zoom: 4,
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

        var counterText =
            'case: ' + ebolaMap.currentIndex + '/' + ebolaMap.features.length;
        $('#count').html(counterText);

        ebolaMap.heatmapData.push(new google.maps.LatLng(lat, lon));

        ebolaMap.setDateOnScreen(item);

        ebolaMap.setCurrentBounds(lat, lon);

        ebolaMap.currentIndex++;

        if (ebolaMap.currentIndex < ebolaMap.features.length) {
          ebolaMap.pinInterval = setTimeout(ebolaMap.placePinsOnMap, 5);
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

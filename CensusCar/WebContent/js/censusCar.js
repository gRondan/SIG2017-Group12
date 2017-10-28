var map;
var tiled
var mapView
var mapURL = "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/TileLayer",
  "esri/widgets/Search",
  "esri/tasks/Locator",
  "dojo/dom",
  "dojo/on",
  "dojo/domReady!"],
  function (Map, MapView, Tiled, Search, Locator, dom, on, domReady) {

      var points = [];

      var pointMarker = {
        type: "simple-marker",
        color: [226, 119, 40],
        outline: {
          color: [255, 255, 255],
          width: 2
        }
      };

      getToken();

      tiled = new Tiled(mapURL);
      
      map = new Map({
        layers: [tiled]   
      });

      mapView = new MapView({
        container: "map",
        zoom: 4, 
        center: [-95,39], 
        spatialReference: { wkid: 102100 },
        map: map
      });

      var searchWidget = new Search({
        view: mapView, 
        sources: [{
            locator: new Locator({ url: "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer" }),
            singleLineFieldName: "SingleLine",
            placeholder: "Find location in USA",
            countryCode: "US"
        }]
      });
      mapView.ui.add(searchWidget, {position: "top-left", index: 0});

      searchWidget.on("select-result", function(event){
        console.log("The selected search result: ", event);
      });
      searchWidget.on("select-result", (result) => {
        var point = {
            name: result.result.name,
            geometry: result.result.feature.geometry,
            symbol: pointMarker,
            graphic: new Graphic({
                geometry: result.result.feature.geometry, 
                symbol: pointMarker,
                spatialReference: { wkid: 102100 }, 
                // Atributos para el servidor de eventos
                attributes: {
                    event_type: "17", 
                    description: result.result.name
                }
            })
        };
        addPoint(point);
        console.clear();
        console.log("The selected search result: ", points[0], points[1]);
      });

      function addPoint(point){
        // Establece el id
        point.id = points.length + 1;

        // Agrega a la capa de paradas
        //stopsLyr.add(point.graphic);

        points.push(point);

        // Cambios en View
        //updateStopsList();
      }
      
      function getToken() {
        $.ajax({
          type: "POST",
          url: "https://www.arcgis.com/sharing/oauth2/token?client_id=mbeKLJKeIY6J2Gyz&grant_type=client_credentials&client_secret=ad9ed9d489b341988779aed7870e2b86&f=pjson",
          //data: data,
          success: (response) => {
            console.log(response);
            responseToken = response.access_token;
          },
          dataType: "json",
          async: false
        });
      }
  });

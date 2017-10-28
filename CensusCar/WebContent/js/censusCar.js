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
      
      function getToken(){

      }
  });

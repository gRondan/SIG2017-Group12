var map;
var tiled
var mapView
var mapURL = "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/TileLayer",
  "esri/tasks/Locator",
  "dojo/dom",
  "dojo/on",
  "dojo/domReady!"],
  function (Map, MapView, Tiled,Locator, 
     dom, on, domReady) {

   
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
      function getToken(){

      }
  });

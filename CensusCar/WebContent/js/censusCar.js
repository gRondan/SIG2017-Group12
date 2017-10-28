var map;
var s;
var locatorUrl = "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";
var puntos;
var puntos = [];
var routes = [];
var routeTask;
var routeParams;
var sonido = true;
var routeGraphicLayer;
var terminarSimulacion = false;
var iter, salto = 0;
var movilPosicion; // Posición del movil
var distanciaPuntos = 0;
var stateActual = "";
var stateAnterior = "";
var color_actual = 1;
var puntosServicioLayer;
var rutaServicioLayer;

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/TileLayer",
  "esri/tasks/Locator",
  "dojo/dom",
  "dojo/on",
  "dojo/domReady!"],
  function (Map, MapView, Tiled, Locator, dom, on, domReady) {

   
      var tiled = new Tiled("http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
      
      map = new Map({
        layers: [tiled]   
      });

      var mapView = new MapView({
        container: "map",
        zoom: 4, 
        center: [-95,39], 
        spatialReference: { wkid: 102100 },
        map: map
      });
  });

var map;
var tiled
var mapView
var mapURL = "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
var clientId = "56pgncO7oT1NYKoY"
var clientSecret = "65dd33cc13224721b1849d2e8c32381a"
var tokenURL = "https://www.arcgis.com/sharing/oauth2/token?client_id=" + clientId + "&grant_type=client_credentials&client_secret=" + clientSecret + "&f=pjson"
var responseToken
var url
var routeURL = "https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World?token="
var points = []
var directionsArray = []
//LAYERS
var pointsLayer
var routesLayer
var countiesLayer
var directionsFeatureLayer

var routeGraphic = {
  type: "simple-line",
  color: "grey",
  width: 4,
};

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/TileLayer",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/widgets/Search",
  "esri/tasks/Locator",
  "dojo/dom",
  "dojo/on",
  "dojo/domReady!",
  "esri/tasks/RouteTask",
  "esri/tasks/support/RouteParameters",
  "esri/tasks/support/FeatureSet",
  "esri/layers/FeatureLayer",],
  function (Map, MapView, Tiled, Graphic, GraphicsLayer, Search, Locator, dom, on, domReady, RouteTask, RouteParameters, FeatureSet,FeatureLayer) {



    //Marcador de los puntos buscados
    var pointMarker = {
      type: "simple-marker",
      color: [255, 0, 0],
      outline: {
        color: [0, 0, 187],
        width: 2
      }
    };

    getToken();

    //Capa Tiled pedida en letra de obligatorio
    tiled = new Tiled(mapURL);

    //Creación del mapa
    map = new Map({
      layers: [tiled]
    });

    setLayers();



    mapView = new MapView({
      container: "map",
      zoom: 4,
      center: [-95, 39],
      spatialReference: { wkid: 102100 },
      map: map
    });







    //Creación del buscador
    var searchWidget = new Search({
      view: mapView,
      sources: [{
        locator: new Locator({ url: "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer" }),
        singleLineFieldName: "SingleLine",
        placeholder: "Find location in USA",
        countryCode: "US"
      }]
    });
    mapView.ui.add(searchWidget, { position: "top-left", index: 0 });

    //Evento que devuelve la búsqueda realizada
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
      console.log("The selected search result: ", points);
    });

    //FUNCIONES AUXILIARES

    function getToken() {
      $.ajax({
        type: "POST",
        url: tokenURL,
        //data: data,
        success: (response) => {
          console.log(response);
          responseToken = response.access_token;
        },
        dataType: "json",
        async: false
      });
    }

    function addPoint(point) {

      point.id = points.length + 1;

      // Agrega el punto a la capa de puntos
      pointsLayer.add(point.graphic);

      points.push(point);

      saveDirection();

      // Cambios en View
      //updateStopsList();
    }

    window.onload = function calculateRoute() {
      document.getElementById("findRoute").onclick = function findRoute() {
        RouteParameters = new RouteParameters({
          stops: new FeatureSet(),
          outSpatialReference: { wkid: 102100 }
        })
        for (i = 0; i < points.length; i++) {
          RouteParameters.stops.features.push(points[i].graphic);
          directionsArray.push(points[i].graphic);
        };
        RouteTask = new RouteTask({
          url: routeURL + responseToken
        })
        console.log(routeURL + responseToken);
        var RouteResoults = RouteTask.solve(RouteParameters)
          .then((data) => {
            var routeResult = data.routeResults[0].route;
            routeResult.symbol = routeGraphic;
            routesLayer.removeAll();
            routesLayer.add(routeResult);

            current_route = routeResult;
          })
        directionsFeatureLayer.applyEdits({
          addFeatures : directionsArray
        })
        .then(() => {
          console.log("Save Stops ok "); 
        })
        .catch(err => {
            console.log("error: "+err);
            
        })
      }
    }

    function setLayers() {
      setGraphicLayers();
      setFeatureLayers();
    }


    
    function setGraphicLayers() {
      pointsLayer = new GraphicsLayer({
        title: "Directions",
        id: "pointsLayer"
      });
      map.layers.add(pointsLayer);

      routesLayer = new GraphicsLayer({
        title: "Routes",
        id: "routesLayer"
      });
      map.layers.add(routesLayer);

      countiesLayer = new GraphicsLayer({
        title: "Counties",
        id: "countiesLayer"
      });
      map.layers.add(countiesLayer);
    }

    function setFeatureLayers() {
      directionsFeatureLayer = new FeatureLayer({
        url: "http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Events/FeatureServer/0",
        //outFields: ["*"],
        //visible: false,
        spatialReference: { wkid: 102100 }
      });
      map.layers.add(directionsFeatureLayer);
    }

    function saveDirection() {

    }
  });

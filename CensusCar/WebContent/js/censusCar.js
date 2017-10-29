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
var pointsLayer
var routesLayer
var countiesLayer
var carLayer
//Estilo de la ruta
var routeGraphic = {
  type: "simple-line",
  color: "grey",
  width: 4,
};
//Marcador de los puntos buscados
var pointMarker = {
  type: "simple-marker",
  color: [255, 0, 0],
  outline: {
    color: [0, 0, 187],
    width: 2
  }
};
//Imagen del vehiculo
var carGraphic = {
  type: "picture-marker",
  url: "img/car.png",
  width: "40px",
  height: "40px"
};
//Estilo del buffer del vehiculo
var bufferGraphic = {
  type: "simple-fill",
  color: [140, 140, 222, 0.5],
  outline: {
      color: [0, 0, 0, 0.5],
      width: 2
  }
};
//Estilo del poligono de los condados
var countyGraphic = {
  type: "simple-fill",
  color: [247, 153, 71, 0.3],
  width: 3
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
  "esri/tasks/support/FeatureSet"],
  function (Map, MapView, Tiled, Graphic, GraphicsLayer, Search, Locator, dom, on, domReady, RouteTask, RouteParameters, FeatureSet) {

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
          attributes: {
            event_type: "17",
            description: result.result.name
          }
        })
      };
      addPoint(point);
    });

    //FUNCIONES AUXILIARES

    function getToken() {
      $.ajax({
        type: "POST",
        url: tokenURL,
        //data: data,
        success: (response) => {
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

      // Cambios en View
      //updateStopsList();
    }

    // Crea el marcador del móvil
    function createCarGraphyc(lng, lat){
      return new Graphic({
              geometry: {
                  type: "point",
                  x: lng,
                  y: lat,
                  spatialReference: { wkid: 102100 }
              },
              symbol: carGraphic
          });
    }

    window.onload = function calculateRoute() {
      document.getElementById("findRoute").onclick = function findRoute() {
        RouteParameters = new RouteParameters({
          stops: new FeatureSet(),
          outSpatialReference: { wkid: 102100 }
        })
        for (i = 0; i < points.length; i++) {
          RouteParameters.stops.features.push(points[i].graphic);
        };
        RouteTask = new RouteTask({
          url: routeURL + responseToken
        })
        var RouteResoults = RouteTask.solve(RouteParameters)
          .then((data) => {
            var routeResult = data.routeResults[0].route;
            routeResult.symbol = routeGraphic;
            routesLayer.removeAll();
            routesLayer.add(routeResult);

            current_route = routeResult;
          })
        var car = new Graphic({
          geometry: {
              type: "point",
              longitude: points[0].geometry.longitude,
              latitude: points[0].geometry.latitude,
              spatialReference: { wkid: 102100 }
          },
          symbol: carGraphic
        });
      //createCarGraphyc(points[0].geometry.longitude, points[0].geometry.latitude);
        carLayer.add(car);
        console.log(car);
      }
    }
  
    function setLayers() {
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

      carLayer = new GraphicsLayer();
      map.layers.add(carLayer);

    }

    

  });

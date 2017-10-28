var map;
var tiled
var mapView
var mapURL = "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
var clientId = "mbeKLJKeIY6J2Gyz"
var clientSecret = "ad9ed9d489b341988779aed7870e2b86"
var tokenURL = "https://www.arcgis.com/sharing/oauth2/token?client_id="+clientId+"&grant_type=client_credentials&client_secret="+clientSecret+"&f=pjson"
var responseToken
var url =

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
  "dojo/domReady!"],
  function (Map, MapView, Tiled, Graphic, GraphicsLayer, Search, Locator, dom, on, domReady) {

    var points = [];

    //Marcador de los puntos buscados
    var pointMarker = {
      type: "simple-marker",
      color: [226, 119, 40],
      outline: {
        color: [255, 255, 255],
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

    //capa de puntos buscados
    var pointsLayer = new GraphicsLayer({
      title: "Puntos",
      id: "pointsLayer"
    });
    map.layers.add(pointsLayer);

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
    mapView.ui.add(searchWidget, {position: "top-left", index: 0});

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
      console.clear();
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

    function addPoint(point){
      
      point.id = points.length + 1;

      // Agrega el punto a la capa de puntos
      pointsLayer.add(point.graphic);

      points.push(point);

      // Cambios en View
      //updateStopsList();
    }
    
});

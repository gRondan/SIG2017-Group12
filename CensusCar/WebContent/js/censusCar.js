var map;
var tiled
var mapView
var mapURL = "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
var clientId = "mbeKLJKeIY6J2Gyz"
var clientSecret = "ad9ed9d489b341988779aed7870e2b86"
var responseToken
var url = 

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/TileLayer",
  "esri/widgets/Search",
  "esri/tasks/Locator",
  "dojo/dom",
  "dojo/on",
  "dojo/domReady!"],
<<<<<<< HEAD
  function (Map, MapView, Tiled, Search, Locator, dom, on, domReady) {
=======
  function (Map, MapView, Tiled, Locator,
    dom, on, domReady) {
    getToken2();
    tiled = new Tiled(mapURL);
>>>>>>> Gio

    map = new Map({
      layers: [tiled]
    });

    mapView = new MapView({
      container: "map",
      zoom: 4,
      center: [-95, 39],
      spatialReference: { wkid: 102100 },
      map: map
    });
    
    
    //FUNCIONES AUXILIARES
    
    function getToken() {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
          if (xhr.readyState == XMLHttpRequest.DONE) {
              alert(xhr.responseText);
          }
      }
      xhr.open('GET','https://www.arcgis.com/sharing/oauth2/token?client_id=mbeKLJKeIY6J2Gyz&grant_type=client_credentials&client_secret=ad9ed9d489b341988779aed7870e2b86&f=pjson', true);
      xhr.send(null);
      //xhr.onreadystatechange = processRequest;
      var response = JSON.parse(xhr.responseText);

    }
    function getToken2(){2
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

    function processRequest(e) {
      if (xhr.readyState == 4 && xhr.status == 200) {
          var response = JSON.parse(xhr.responseText);
          
          alert(response.ip);
      }
  }
  });

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
var simulating = false;
var current_route = null;
//LAYERS
var pointsLayer
var routesLayer
var countiesLayer
var carLayer
//Estilo de la ruta
var directionsFeatureLayer

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
  width: "50px",
  height: "50px"
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
  "esri/tasks/GeometryService",
  "esri/tasks/support/DensifyParameters",
  "esri/geometry/geometryEngine",
  "esri/tasks/support/FeatureSet",
  "esri/layers/FeatureLayer",],
  function (Map, MapView, Tiled, Graphic, GraphicsLayer, Search, Locator, dom, on, domReady, RouteTask, RouteParameters, GeometryService, DensifyParameters, geometryEngine, FeatureSet,FeatureLayer) {

    getToken();

    //Capa Tiled pedida en letra de obligatorio
    tiled = new Tiled(mapURL);

    //Creación del mapa
    map = new Map({
      layers: [tiled]
    });

    setLayers();

    // Se define el servicio para operaciones espaciales
    var geometrySvc = new GeometryService({url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer"});

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

      saveDirection();

      // Cambios en View
      //updateStopsList();
    }

    // Crea el marcador del móvil
    function createCarGraphyc(lng, lat){
      return new Graphic({
              geometry: {
                  type: "point",
                  x: lng,//longitude: lng,
                  y: lat,//latitude: lat,
                  spatialReference: { wkid: 102100 }
              },
              symbol: carGraphic
          });
    }

    window.onload = function calculateRoute() {
      document.getElementById("findRoute").onclick = function findRoute() {
        if (points.length >= 2){
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
          var RouteResoults = RouteTask.solve(RouteParameters)
            .then((data) => {
              var routeResult = data.routeResults[0].route;
              routeResult.symbol = routeGraphic;
              routesLayer.removeAll();
              routesLayer.add(routeResult);

              current_route = routeResult;
            })
          var car = createCarGraphyc(points[0].geometry.x, points[0].geometry.y);
          carLayer.add(car);
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
      };
      document.getElementById("playSimulation").onclick = function startSimulation(){
        if(current_route){
            if(simulating){
                //showToast("Hay una simulación en curso.", "error");
                return;
            }
            simulating = true;
            //velocityLyr.removeAll();
            //chgSimBtn();
            
            var simulation = {
                iteration: 0,
                buffer_size: 1, //getBufferSize(),
                segment_length: 500, // 100m
                step: 1, //getSimStep(),
                travelled_length: 0, // km
                last_exec_time: 0,
                coordinates: null
            }

            // Se obtiene la ruta como una serie de puntos equidistantes
            // Se utiliza Geometry Engine o Service dependiendo del modo
            getDensify(simulation).then(path => {
                simulation.coordinates = path;
                simulation.last_exec_time = performance.now();
                
                //disableSimButtons();
                //showToast("Simulación iniciada", "info");
                updateSimulation(simulation);
            });
        }else{
            //showToast("Primero debe indicarse una ruta.", "error");
            return;
        }
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
        spatialReference: { wkid: 102100 }
      });
      map.layers.add(directionsFeatureLayer);
    }

    function saveDirection() {

      carLayer = new GraphicsLayer();
      map.layers.add(carLayer);

    }

    //SIMULACION
    // Comienza la simulación
    /*window.onload = function playRoute() {
      document.getElementById("playSimulation").onclick = function startSimulation(){
        if(current_route){
            if(simulating){
                //showToast("Hay una simulación en curso.", "error");
                return;
            }
            simulating = true;
            //velocityLyr.removeAll();
            //chgSimBtn();
            
            var simulation = {
                iteration: 0,
                buffer_size: 1, //getBufferSize(),
                segment_length: 500, // 100m
                step: 1, //getSimStep(),
                travelled_length: 0, // km
                last_exec_time: 0,
                coordinates: null
            }

            // Se obtiene la ruta como una serie de puntos equidistantes
            // Se utiliza Geometry Engine o Service dependiendo del modo
            getDensify(simulation).then(path => {
                simulation.coordinates = path;
                simulation.last_exec_time = performance.now();
                
                //disableSimButtons();
                //showToast("Simulación iniciada", "info");
                updateSimulation(simulation);
            });
        }else{
            //showToast("Primero debe indicarse una ruta.", "error");
            return;
        }
      }
    }*/

    // Para la simulación
    function stopSimulation(){
      if(simulating){
          simulating = false;
          
          //chgSimBtn();
          //enableSimButtons();
          //showToast("Simulación finalizada!", "info");
      }else{
          //showToast("No hay una simulación en curso", "error");
      }
  }

    // Actualiza el mapa durante la simulación
    function updateSimulation(simulation){
      if(simulating){
          // Si ya no tengo mas coordenadas termino
          if(simulation.iteration >= simulation.coordinates.length){
              stopSimulation();
              return;
          }

          // Si me paso lo seteo en el ultimo
          if(simulation.iteration + simulation.step >= simulation.coordinates.length){
             simulation.iteration = simulation.coordinates.length-1; 
          }

          // Busca la coordenada, crea el marcador.
          var next_coordinate = simulation.coordinates[simulation.iteration];
          var new_marker = createCarGraphyc(next_coordinate[0], next_coordinate[1]);
          carLayer.removeAll();
          carLayer.add(new_marker);
          simulation.step = 1; //getSimStep();
          simulation.buffer_size = 1; //getBufferSize();

          simulation.iteration += simulation.step;
          simulation.travelled_length += simulation.segment_length * simulation.step;
          simulation.last_exec_time = performance.now();
          updateSimulation(simulation);

          // Calculo el buffer y lo agrego a la capa con el móvil.
          /*getBuffer(new_marker, simulation).then(buffer => {
              if(simulating){
                  var counties = queryCounty(buffer, simulation);
                  var states = queryState(buffer, simulation);

                  // Cuando terminen las queries se renderizan
                  Promise.all([counties, states])
                  .then(results => {
                      if(simulating){
                          var stateGraphics = [];
                          var countiesGraphics = [];
                          var content = "";
                          var counties_promise = Promise.resolve(false);

                          if(results[1]){
                              content += `
                                  <b>Estados intersectados: </b><br/>
                                  <ul>
                              `;
                              results[1].forEach(state => {
                                  stateGraphics.push(state.graphic);
                                  content += `
                                      <li>${state.name}, ${state.st_abbrev}</li>
                                  `;
                              });
                              content += `
                                  </ul>
                              `;
                          }
                          if(results[0]){
                              content += `
                                  <b>Condados intersectados: </b><br/>
                                  <ul>
                              `;
                              var population_promises = [];
                              results[0].forEach(county => {
                                  countiesGraphics.push(county.graphic);
                                  population_promises.push(
                                      getLocalPopulation(buffer, county)
                                      .then(local_population => {
                                          var population_percentage = Math.round((local_population / county.total_population) * 100); 
                                          return {
                                              local_population: local_population,
                                              county_population: county.total_population,
                                              list_item: `<li>${county.name}, ${county.st_abbrev} - ${local_population}/${county.total_population} (%${population_percentage})</li>`
                                          }
                                      }
                                  ));
                              });

                              counties_promise = Promise.all(population_promises)
                              .then(counties_info => {
                                  var total_local_population = 0;
                                  var total_county_population = 0;
                                  counties_list = "";
                                  counties_info.forEach(county_info => {
                                      total_local_population += county_info.local_population;
                                      total_county_population += county_info.county_population;
                                      counties_list += county_info.list_item;
                                  });

                                  var population_percentage = Math.round((total_local_population / total_county_population) * 100); 
                                  var travelled_distance = simulation.travelled_length >= 1000 ? 
                                      (simulation.travelled_length / 1000).toFixed(1) + "km" :
                                      (simulation.travelled_length) + "m";
                                  var step_distance = simulation.step * simulation.segment_length >= 1000 ? 
                                      (simulation.step * simulation.segment_length / 1000).toFixed(1) + "km" : 
                                      (simulation.step * simulation.segment_length) + "m";
                                  // var actual_velocity = Math.round((simulation.segment_length / 1000) / ((performance.now() - simulation.last_exec_time) / 3600000));
                                  content += counties_list;
                                  content += `
                                      </ul>
                                      <b>Población total en el buffer: ${total_local_population} (%${population_percentage})</b>
                                      <hr/>
                                      <b>Distancia recorrida: ${travelled_distance}</b><br/>
                                      <b>Distancia por iteración: ${step_distance}</b>
                                  `;
                                  return true;
                              });
                          }

                          Promise.all([counties_promise])
                          .then(results => {
                              if(simulating){
                                  if(results[0]){
                                      // graphics.push(new_marker);
                                      // graphics.push(buffer);

                                      mobileLyr.removeAll();
                                      mobileLyr.addMany([new_marker, buffer]);

                                      countiesLyr.removeAll();
                                      countiesLyr.addMany(countiesGraphics);

                                      statesLyr.removeAll();
                                      statesLyr.addMany(stateGraphics);

                                      // Actualizo el popup
                                      view.popup.open({
                                          title: "Información de la simulación",
                                          content: content,
                                          dockEnabled: true,
                                          dockOptions: {
                                              breakpoint: false,
                                              buttonEnabled: false,
                                              position: "top-right"
                                          }
                                      });

                                      updateVelocityLine(simulation);
                                      simulation.step = getSimStep();
                                      simulation.buffer_size = getBufferSize();

                                      simulation.iteration += simulation.step;
                                      simulation.travelled_length += simulation.segment_length * simulation.step;
                                      simulation.last_exec_time = performance.now();
                                      updateSimulation(simulation);
                                  }
                              }
                          });
                      }
                  });
              }
          });*/
      }
    }

    
    // Obtiene la ruta actual como una serie de puntos equidistantes
    function getDensify(simulation){
      var path_promise;
      /*if(mode == "service"){
          var densifyParams = new DensifyParameters({
              geometries: [current_route.geometry],
              lengthUnit: "meters",
              maxSegmentLength: simulation.segment_length,
              geodesic: true
          });

          path_promise = geometrySvc.densify(densifyParams)
          .then(data => {
              return data[0].paths[0];
          })
          .catch(err => {
              alert("Error al calcular los puntos de ruta");
              console.log("Densify: ", err);
          });
      } else if(mode == "engine"){*/
          path_promise = Promise.resolve(
              geometryEngine.densify(current_route.geometry, simulation.segment_length, "meters").paths[0]
          );
      //}

      return Promise.all([path_promise])
      .then(paths => {
          return paths[0];
      })
      .catch(err => {
        alert("Error al calcular los puntos de ruta");
        console.log("Densify: ", err);
      });
    }
    

  });

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
var directionsFeatureLayerURL = "http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Events/FeatureServer/0"
var routesFeatureLayerURL = "http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1"
var directionURL = 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?singleLine='
var findAddressParameters = '&forStorage=true&maxLocations=1&&token='
var exportPDFURL = "http://sampleserver5.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
var CountiesLayerURL = "http://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_1990-2000_Population_Change/MapServer/3"
var geometryService
var geometryServiceURL = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer"
var points = []
var directionsArray = []
var simulating = false;
var current_route = null;
var addressResult
var xDirection
var yDirection
var trayectoryPopulation
//LAYERS
var pointsLayer
var routesLayer
var countiesLayer
var carLayer
var directionsFeatureLayer
var routesFeatureLayer
var visibilityLayer
var velocityLayer
//QUERY
var directionsQueryTask
var directionsQuery
var routeQueryTask
var routeQuery
var countiesQueryTask
var countiesQuery

//Estilo de la ruta


var routeStyle = {
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
var visibilitySymbol = {
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
var countyGraphicLowPopulation = {
  type: "simple-fill",
  color: "green",
  width: 3
};
var countyGraphicMediumPopulation = {
  type: "simple-fill",
  color: "yellow",
  width: 3
};
var countyGraphicHighPopulation = {
  type: "simple-fill",
  color: "red",
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
  "esri/layers/FeatureLayer",
  "esri/tasks/QueryTask", "esri/tasks/support/Query",
  "esri/tasks/PrintTask",
  "esri/tasks/support/PrintParameters",
  "esri/tasks/support/PrintTemplate",
  "esri/tasks/support/BufferParameters",
  "esri/geometry/Point",
  "esri/tasks/support/AreasAndLengthsParameters",
  "esri/geometry/Polyline"],
  function (Map, MapView, Tiled, Graphic, GraphicsLayer, Search, Locator, dom, on, domReady, RouteTask,
    RouteParameters, GeometryService, DensifyParameters, geometryEngine, FeatureSet, FeatureLayer, QueryTask,
    Query, PrintTask, PrintParameters, PrintTemplate, BufferParameters, Point, AreasAndLengthsParameters,
    Polyline) {

    getToken();
    prepareQueries();

    //Capa Tiled pedida en letra de obligatorio
    tiled = new Tiled(mapURL);

    //Creación del mapa
    map = new Map({
      layers: [tiled]
    });


    initializeRouteVariables();
    setLayers();

    // Se define el servicio para operaciones espaciales
    geometryService = new GeometryService({
      url: geometryServiceURL
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
    /*function findAddress() {
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
    }*/

    function addPoint(point) {

      point.id = points.length + 1;

      // Agrega el punto a la capa de puntos
      pointsLayer.add(point.graphic);

      points.push(point);

      saveDirection();

      // Cambios en View
      updatePointsList();
    }

    // Crea el marcador del móvil
    function createCarGraphyc(lng, lat) {
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

    function createVisibilityGraphyc(lng, lat) {
      return new Graphic({
        geometry: {
          type: "polygon",
          x: lng,//longitude: lng,
          y: lat,//latitude: lat,
          spatialReference: { wkid: 102100 }
        },
        symbol: visibilitySymbol
      });
    }

    window.onload = function executeActions() {
      document.getElementById("searchAddress").onclick = function findAddress() {
        var selectedDirection = document.getElementById("address").value;
        var directionURLGET = directionURL + selectedDirection + findAddressParameters + responseToken + '&f=pjson'
        console.log(directionURLGET);

        $.ajax({
          type: "POST",
          url: directionURLGET,
          //data: data,
          success: (response) => {
            addressResult = response;
          },
          dataType: "json",
          async: false
        });
        if (addressResult.candidates.length > 0) {
          xDirection = addressResult.candidates[0].location.x
          yDirection = addressResult.candidates[0].location.y
          var point = {
            name: addressResult.candidates[0].address,
            geometry: {
              type: "point",
              latitude: yDirection,
              longitude: xDirection,
              spatialReference: { wkid: 102100 }
            },
            symbol: pointMarker,
            graphic: new Graphic({
              geometry: {
                type: "point",
                latitude: yDirection,
                longitude: xDirection,
                spatialReference: { wkid: 102100 }
              },
              symbol: pointMarker
            })
          };
          addPoint(point);
          addAddressToList(point);
        } else {
          alert("No se ha encontrado la dirección " + selectedDirection);
        }


      };
      document.getElementById("findRoute").onclick = function findRoute() {
        if (points.length >= 2) {
          // clearLayers();
          /*
                    RouteParameters = new RouteParameters({
                      stops: new FeatureSet(),
                      outSpatialReference: { wkid: 102100 }
                    })
            */
          carLayer.removeAll();
          routesLayer.removeAll();

          RouteParameters.stops.features = [];
          for (i = 0; i < points.length; i++) {
            RouteParameters.stops.features.push(points[i].graphic);
            directionsArray.push(points[i].graphic);
          };
          /*RouteTask = new RouteTask({
            url: routeURL + responseToken
          })*/

          //points = [];
          //points.length = 0;
          var RouteResoults = RouteTask.solve(RouteParameters)
            .then((data) => {
              var routeResult = data.routeResults[0].route;
              routeResult.symbol = routeStyle;
              routesLayer.removeAll();
              routesLayer.add(routeResult);

              current_route = routeResult;
              console.log(current_route);

              var routeGraphic = new Graphic();
              routeGraphic.geometry = current_route.geometry;
              routeGraphic.attributes = {
                name: "routeGraphic",
                trailtype: 4
              };
              routesFeatureLayer.applyEdits({
                addFeatures: [routeGraphic]
              }).then(() => {
                console.log("Save routes ok ");
                /*routeQueryTask.execute(routeQuery).then(function (results) {
                  console.log("routeQueryTask execute ok");
                  console.log(results.features);
                })
                  .catch(err => {
                    console.log("error query: " + err);
                  });*/
              })
                .catch(err => {
                  console.log("error: " + err);

                });

            }).catch(err => {
              console.log("error: " + err);



            })
          var car = createCarGraphyc(points[0].graphic.geometry.x, points[0].graphic.geometry.y);
          carLayer.add(car);
          directionsFeatureLayer.applyEdits({
            addFeatures: directionsArray
          })
            .then(() => {
              console.log("Save Stops ok ");
            })
            .catch(err => {
              console.log("error: " + err);

            })
          directionsQueryTask.execute(directionsQuery).then(function (results) {
            console.log("directionsQueryTask execute ok");
            console.log(results.features);
          })
            .catch(err => {
              console.log("error query: " + err);
            });

        }
      };
      document.getElementById("pauseSimulation").onclick = function startSimulation() {
        simulating = false;
        $('#ptosList').prop('hidden',false);
        $('#infoList').prop('hidden',true);
      }
      document.getElementById("playSimulation").onclick = function startSimulation() {
        if (current_route) {
          if (simulating) {
            //showToast("Hay una simulación en curso.", "error");
            return;
          }
          $('#ptosList').prop('hidden',true);
          $('#infoList').prop('hidden',false);
          trayectoryPopulation = 0;
          simulating = true;
          velocityLayer.removeAll();
          //chgSimBtn();

          var simulation = {
            iteration: 0,
            buffer_size: getBuffSize(),
            segment_length: 500, // 100m
            step: 10*getBuffSize(), //getSimStep(),
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
        } else {
          //showToast("Primero debe indicarse una ruta.", "error");
          return;
        }
      }
      document.getElementById("exportPDF").onclick = function exportPDF() {
        var printTask = new PrintTask({
          url: exportPDFURL
        });
        var pdfTemplate = new PrintTemplate({
          format: "pdf"
        })
        var printParameters = new PrintParameters({
          view: mapView,
          template: pdfTemplate
        })
        printTask.execute(printParameters)
          .then(response => {
            window.open(response.url, "_blank");
          })
          .catch(err => {
            console.log("Print PDF: ", err);
            showToast("Hubo un error al crear el PDF", "error");
          });
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

      visibilityLayer = new GraphicsLayer({
        title: "Visibility",
        id: "visibilityLayer"
      });
      map.layers.add(visibilityLayer);

      velocityLayer = new GraphicsLayer({
        title: "Velocity",
        id: "velocityLayer"
      });
      map.layers.add(velocityLayer);
    }

    function setFeatureLayers() {
      directionsFeatureLayer = new FeatureLayer({
        url: directionsFeatureLayerURL,
        //outFields: ["*"],
        visible: false,
        spatialReference: { wkid: 102100 }
      });
      map.layers.add(directionsFeatureLayer);

      routesFeatureLayer = new FeatureLayer({
        url: routesFeatureLayerURL,
        visible: false
      });
      map.layers.add(routesFeatureLayer);

      /* countiesLayer = new FeatureLayer({
         url: CountiesLayerURL,
         visible: true
       });
 
       map.layers.add(countiesLayer);*/
    }

    function saveDirection() {

      carLayer = new GraphicsLayer({
        title: "Car",
        id: "carLayer"
      });
      map.layers.add(carLayer);

    }


    // Para la simulación
    function stopSimulation() {
      if (simulating) {
        carLayer.removeAll();
        simulating = false;

        //chgSimBtn();
        //enableSimButtons();
        //showToast("Simulación finalizada!", "info");
      } else {
        //showToast("No hay una simulación en curso", "error");
      }
    }

    // Actualiza el mapa durante la simulación
    async function updateSimulation(simulation) {
      if (simulating) {
        // Si ya no tengo mas coordenadas termino
        if (simulation.iteration >= simulation.coordinates.length) {
          stopSimulation();
          return;
        }

        // Si me paso lo seteo en el ultimo
        if (simulation.iteration + simulation.step >= simulation.coordinates.length) {
          simulation.iteration = simulation.coordinates.length - 1;
        }

        // Busca la coordenada, crea el marcador.
        var next_coordinate = simulation.coordinates[simulation.iteration];
        var car = createCarGraphyc(next_coordinate[0], next_coordinate[1]);
        carLayer.removeAll();
        carLayer.add(car);
        buffer = createBuffer(car, next_coordinate[0], next_coordinate[1]);
        //var visibilityGraphic = createVisibilityGraphyc(next_coordinate[0], next_coordinate[1]);
        /*
        visibilityLayer.removeAll();
        visibilityLayer.add(visibilityGraphic);*/
        /* simulation.step = 5;
        simulation.buffer_size = 1; */

        /* simulation.iteration += simulation.step;
        simulation.travelled_length += simulation.segment_length * simulation.step;
        simulation.last_exec_time = performance.now(); */
        var velocidad;
        if ($('#vbaja')[0].checked) {
          velocidad = 6000;
        } else if ($('#vmedia')[0].checked) {
          velocidad = 3000;
        } else if ($('#valta')[0].checked) {
          velocidad = 1000;
        } else if ($('#vmuyalta')[0].checked) {
          velocidad = 250;
        }

        await sleep(velocidad);
        updateVelocityLine(simulation);
        simulation.step = 5;
        simulation.buffer_size = getBuffSize();
        simulation.iteration += simulation.step;
        simulation.travelled_length += simulation.segment_length * simulation.step;
        simulation.last_exec_time = performance.now();
        updateSimulation(simulation);

      }
    }


    // Obtiene la ruta actual como una serie de puntos equidistantes
    function getDensify(simulation) {
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
        geometryEngine.densify(current_route.geometry, simulation.segment_length, "kilometers").paths[0]
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

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function prepareQueries() {
      directionsQueryTask = new QueryTask({
        url: directionsFeatureLayerURL
      });
      directionsQuery = new Query();
      directionsQuery.returnGeometry = true;
      directionsQuery.outFields = ["*"];
      directionsQuery.where = "event_type = '17'";

      routeQueryTask = new QueryTask({
        url: routesFeatureLayerURL
      });
      routeQuery = new Query();
      routeQuery.returnGeometry = true;
      routeQuery.outFields = ["*"];
      routeQuery.where = `name = 'routeGraphic'`;

      countiesQueryTask = new QueryTask({
        url: CountiesLayerURL
      });
      countiesQuery = new Query();
      countiesQuery.returnGeometry = true;
      countiesQuery.outFields = ["*"];
      countiesQuery.geometry = "intersects";
    }
    function addAddressToList(point) {

    }

    function clearAddressList() {

    }

    function initializeRouteVariables() {
      RouteParameters = new RouteParameters({
        stops: new FeatureSet(),
        outSpatialReference: { wkid: 102100 }
      })
      /*for (i = 0; i < points.length; i++) {
        RouteParameters.stops.features.removeAll();
        directionsArray.removeAll();
      };*/
      RouteTask = new RouteTask({
        url: routeURL + responseToken
      })
    }
    function createBuffer(car) {
      var bufferParameters = new BufferParameters();
      bufferParameters.geometries = [car.geometry];
      bufferParameters.distances = [getBuffSize()]
      bufferParameters.geodesic = true;
      bufferParameters.unit = "kilometers";
      bufferParameters.outSpatialReference = { "wkid": 102100 };
      geometryService.buffer(bufferParameters)
        .then(response => {
          var bufferPromise = response[0];
          Promise.all([bufferPromise]).then((result) => {
            var buffer = new Graphic({
              geometry: result[0],
              symbol: visibilitySymbol
            });
            carLayer.add(buffer);
            countiesLayer.removeAll();
            queryPopulation(buffer);
            carLayer.add(buffer);
          })
            .catch(err => {
              console.log("createBuffer promise: ", err)
            });
        })
        .catch(err => {
          console.log("createBuffer geometryService: ", err)
        });
    }
    function queryPopulation(buffer) {
      var countyQuery = new Query();
      countyQuery.geometry = buffer.geometry;
      countyQuery.spatialRelationship = "intersects";
      countyQuery.outFields = ["*"];
      countyQuery.outSpatialReference = { wkid: 102100 };
      countyQuery.returnGeometry = true;

      countiesQueryTask.execute(countyQuery).then(data => {
        var countiesIntersected = [];
        data.features.forEach(feature => {
          countiesIntersected.push({
            name: feature.attributes.NAME,
            totalPopulation: feature.attributes.TOTPOP_CY,
            landArea: feature.attributes.LANDAREA,
            //stAbbrev: feature.attributes.ST_ABBREV,
            graphic: new Graphic({
              geometry: feature.geometry,
              symbol: countyGraphic
            })
          });
        })
        Promise.all([countiesIntersected]).then(result => {
          if (result[0]) {
            var populationPromises = [];
            result[0].forEach(county => {
              /*countiesLayer.add(new Graphic({
                geometry: county.graphic.geometry,
                symbol: countyGraphic
              }));*/

              populationPromises.push(
                calculatePopulation(county, buffer).then(intersectResult => {
                  var countyName = intersectResult.countyName;
                  var populationDetected = intersectResult.populationDetected;
                  var countyGeometry = intersectResult.countyGeometry;
                  var totalCountyPopulation = intersectResult.totalCountyPopulation;
                  return { countyName, populationDetected, countyGeometry, totalCountyPopulation };
                }
                ));
            })
            countiesPromise = Promise.all(populationPromises)
              .then(result => {
                var populationCalculated = 0;
                //counties_list = "";
                console.log("counties intersected: " + result.length);
                result.forEach(countyInfo => {
                  populationCalculated += countyInfo.populationDetected;
                  trayectoryPopulation += countyInfo.populationDetected;
                  $('#infoSimu').empty();
                  $("<b> Estado: </b>"+countyInfo.countyName+ "<br/>"
                    + "<b>Condado : Pob en buffer / Pob Total: </b><br/>"
                    + countyInfo.countyName + ": " + Math.round(countyInfo.populationDetected) + " / " + Math.round(countyInfo.totalCountyPopulation)+ "<br/>"
                    + "<b>Total población en buffer: </b>" + Math.round(populationCalculated) +" hábitantes <br/>"
                    + "<b>Total población en trayectoria: </b>" + Math.round(trayectoryPopulation) +" hábitantes <br/>").appendTo( "#infoSimu" );


                  /* console.log("countyInfo.countyName: " + countyInfo.countyName);
                  var populationGraphic;
                  //if 
                  countiesLayer.add(new Graphic({
                    geometry: countyInfo.countyGeometry,
                    symbol: countyGraphic
                  }));
                  console.log("countyInfo.countyName: " + countyInfo.countyName);
                  console.log("countyInfo.populationDetected: " + countyInfo.populationDetected);
                  populationCalculated += countyInfo.populationDetected;
                  //totalCountyPopulation += countyInfo.county_population;
                  console.log("populationCalculated: " + populationCalculated); */
                  // countiesList += result.list_item;
                });

              });


          }
        })
      })
    }

    function calculatePopulation(county, buffer) {
      var intersectPromise = geometryService.intersect([buffer.geometry], county.graphic.geometry).then(intersectResult => {
        var areasAndLengthsParameters = new AreasAndLengthsParameters();
        areasAndLengthsParameters.polygons = intersectResult;
        areasAndLengthsParameters.areaUnit = "square-kilometers";
        areasAndLengthsParameters.lengthUnit = "kilometers";
        areasAndLengthsParameters.calculationType = "preserve-shape";
        return geometryService.areasAndLengths(areasAndLengthsParameters).then(areaResult => {
          // console.log("areaResult: " + areaResult)
          // console.log("areaResult.areas[0]: " + areaResult.areas[0])
          return areaResult.areas[0];
        }).catch(err => {
          console.log("areasAndLengths err: " + err);
        })

      }).catch(err => {
        console.log("intersect err: " + err);
      });
      return Promise.all([intersectPromise]).then(result => {
        var intersectedArea = result[0] / (county.landArea * 2.58999);
        var populationDetected = county.totalPopulation * intersectedArea;
        var countyName = county.name;
        var countyGeometry = county.graphic.geometry;
        var totalCountyPopulation = county.totalPopulation;
        //console.log("county.name: " + county.name);
        //console.log("populationDetected: " + populationDetected);
        return { countyName, populationDetected, countyGeometry, totalCountyPopulation };
      })
    }
    // Calcula y crea la línea de velocidad
    function updateVelocityLine(simulation) {
      var velocity_path = [];
      var start = simulation.iteration - simulation.step >= 0 ? simulation.iteration - simulation.step : 0;
      for (var i = start; i <= simulation.iteration; i++) {
        velocity_path.push(simulation.coordinates[i]);
      }

      var color;
      if ($('#vbaja')[0].checked) {
        color = "green";
      } else if ($('#vmedia')[0].checked) {
        color = "yellow";
      } else if ($('#valta')[0].checked) {
        color = "orange";
      } else if ($('#vmuyalta')[0].checked) {
        color = "red";
      }


      velocityLayer.graphics.add(new Graphic({
        geometry: new Polyline({
          paths: velocity_path,
          spatialReference: { wkid: 102100 }
        }),
        symbol: {
          type: "simple-line",
          color: color,
          width: "4",
        }
      }));
    }

    // Retorna el valor del buffer ingresado
    function getBuffSize() {
      var val = $("#buffSize").val();
      if (val && parseInt(val) >= 1) {
        return parseInt(val);
      } else {
        return 1;
      }
    }

  });
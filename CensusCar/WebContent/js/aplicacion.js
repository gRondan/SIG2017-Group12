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

require(["esri/urlUtils",
 "esri/config",
 "esri/map",
 "esri/dijit/Print",
 "esri/tasks/PrintTemplate",
 "esri/tasks/locator",
 "esri/IdentityManager",
 "esri/tasks/DistanceParameters",
 "esri/layers/FeatureLayer",
 "esri/tasks/geometry",
 "esri/layers/ArcGISTiledMapServiceLayer",
 "esri/layers/ArcGISDynamicMapServiceLayer",
 "esri/layers/GraphicsLayer",
 "esri/dijit/Search",
 "esri/toolbars/draw",
 "esri/geometry/Point",
 "esri/symbols/SimpleMarkerSymbol",
 "esri/symbols/SimpleLineSymbol",
 "esri/symbols/SimpleFillSymbol",
 "esri/graphic",
 "esri/geometry/geodesicUtils",
 "esri/units",
 "esri/Color",
 "dojo/_base/array",
 "dojo/_base/event",
 "esri/tasks/RouteTask",
 "esri/tasks/RouteParameters",
 "esri/tasks/FeatureSet",
 "esri/tasks/QueryTask",
 "esri/tasks/query",
 "esri/geometry/webMercatorUtils",
 "esri/geometry/geometryEngine",
 "esri/geometry/Extent",
 "esri/SpatialReference",
 "dojo/dom",
 "dojo/on",
 "dojo/domReady!"],
 function(urlUtils, esriConfig, Map, Print, PrintTemplate, Locator, esriId, DistanceParameters, FeatureLayer, Geometry,
   Tiled, DynamicMapServiceLayer, GraphicsLayer, Search, Draw, Point, SimpleMarkerSymbol, SimpleLineSymbol,
   SimpleFillSymbol, Graphic, geodesicUtils, Units, Color, array, event, RouteTask, RouteParameters, FeatureSet,
   QueryTask, Query, webMercatorUtils, GeometryEngine, Extent, SpatialReference, dom, on) {

  // Obtener token dinamico
  var data = {client_id: "flL9d1hXjmPLIyzM", client_secret: "6cefd5ea7de8479f98bebbb9081db0d3", grant_type: "client_credentials"};
  $.ajax({type: "POST", url: "https://www.arcgis.com/sharing/rest/oauth2/token/", data, dataType: 'json', success});

  // Funcion principal
  function success(token){

  //Creo el mapa
  map = new Map("map", { fadeOnZoom: true, zoom:4, minZoom:4, center: [-95,39], smartNavigation:false});

  // Cargar mapa base
  var tiled = new Tiled("http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
  map.addLayer(tiled);

  // Buscador de puntos
  s = new Search({sources: [
      {
        locator: new Locator(locatorUrl),
        placeholder: "Buscador de puntos",
        countryCode: "US",
      }
    ],
    map: map
  }, "search");

  s.startup();
  s.on ("search-results", searchHandler);

  // Símbolo para los puntos
  var markerSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE);
  markerSymbol.setColor(new Color("#0101DF"));
  markerSymbol.setSize(13);

  // Símbolo para el móvil
  var movilSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE);
  movilSymbol.setPath("M16,3.5c-4.142,0-7.5,3.358-7.5,7.5c0,4.143,7.5,18.121,7.5,18.121S23.5,15.143,23.5,11C23.5,6.858,20.143,3.5,16,3.5z M16,14.584c-1.979,0-3.584-1.604-3.584-3.584S14.021,7.416,16,7.416S19.584,9.021,19.584,11S17.979,14.584,16,14.584z");
  movilSymbol.setOffset(0, 15);
  movilSymbol.setColor(new Color("#FF4500"));
  movilSymbol.setSize(20);

  //Símbolo para la ruta
  var routeSymbol = new SimpleLineSymbol().setColor(new Color([0,0,255,0.5])).setWidth(4);

  // Capa donde se traen los puntos del servicio
  puntosServicioLayer = new GraphicsLayer({opacity:0.9});

  //Cargar puntos del servidor
  var pointsFL = FeatureLayer("http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Events/FeatureServer/0", {
    mode: FeatureLayer.MODE_SNAPSHOT,
    outFields: ["*"]
  });
  pointsFL.setSelectionSymbol(markerSymbol);

  // Descargar pdf
  var printer = new Print({
    map: map,
    url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
    templates: [{
      label: "Layout",
      format: "PDF",
      layout: "A4 Portrait",
      layoutOptions: {
        titleText: "Laboratorio 2",
        authorText: "Grupo 4",
        copyrightText: "SIG",
      },
      exportOptions: {
        width: 500,
        height: 400,
        dpi: 96
      }
    }]
  }, dom.byId("printButton"));
  printer.startup();

  //Configuración de proxy
  esriConfig.defaults.io.proxyUrl = "/proxy/";
  esriConfig.defaults.io.alwaysUseProxy = false;

  //Cargar servicio de ruteo
  routeTask = new RouteTask("http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World?token="+token.access_token);
  routeParams = new RouteParameters();
  routeParams.stops = new FeatureSet();
  routeParams.outSpatialReference = {"wkid":102100};

  routeTask.on("solve-complete", dibujarRuta);

  // Graphic layer
  var routeGraphicLayer = new GraphicsLayer({opacity:0.9});
  var symbol = new SimpleFillSymbol();

  on(dom.byId("soundOn"), "click", deshabilitarSonido);
  on(dom.byId("soundOff"), "click", habilitarSonido);

  // Botón calcular ruta: Calcula la ruta para los STOPs ingresados
  on(dom.byId("rutaBtn"), "click", calcularRuta);
  function calcularRuta(){
    routeTask.solve(routeParams);
  }

  // Botón borrar rutas: Limpia las rutas dibujadas del mapa y de la lista
  on(dom.byId("borrarRutaBtn"), "click", borrarRutas);
  function borrarRutas() {
    for (var i=routes.length-1; i>=0; i--) {
      map.graphics.remove(routes.splice(i, 1)[0]);
    }
    routes = [];
    routeGraphicLayer.clear();
    if (rutaServicioLayer !== undefined) {
      rutaServicioLayer.clear();
    }
    $('#borrarRutaBtn').prop('disabled', true);
  }

  // Botón borrar puntos: Limpia los puntos dibujados del mapa, como stop y de la lista
  on(dom.byId("borrarPtosBtn"), "click", borrarPuntos);
  function borrarPuntos() {
    for (var i=routeParams.stops.features.length-1; i>=0; i--) {
        map.graphics.remove(routeParams.stops.features.splice(i, 1)[0]);
    }
    puntos= [];
    $('#listaPtos').empty();
    $(dom.byId("guardarPtosBtn")).prop('disabled', true);
    $(dom.byId("borrarPtosBtn")).prop('disabled', true);
    $(dom.byId("listMsj")).prop('hidden', false);
    $(dom.byId("rutaBtn")).prop('disabled', true);

    puntosServicioLayer.clear();
  }

  // Dibuja la ruta calculada
  function dibujarRuta(evt) {
    borrarRutas();
    array.forEach(evt.result.routeResults, function(routeResult, i) {
      routes.push(
        map.graphics.add(
          routeResult.route.setSymbol(routeSymbol)
          )
        );
      routeGraphicLayer.add(routeResult.route.setSymbol(routeSymbol));
      map.centerAndZoom([-95,39],4);
    });

  // Agrego la capa de la ruta
  map.addLayer(routeGraphicLayer);

  // Deshabilito botones
  $(dom.byId("startBtn")).prop('disabled', false);
  $(dom.byId("borrarRutaBtn")).prop('disabled', false);
  $(dom.byId("guardarRutaBtn")).prop('disabled', false);
}

  // Guardar Puntos en el servicio
  var cantElemList = 0;
  function searchHandler(evt){
    cantElemList = puntos.length; //AGREGUEEE
    var pto = evt.results[0][0];
    var puntoNuevo = new Object();
    puntoNuevo.name = pto.name;
    puntoNuevo.geometry = pto.feature.geometry;
    puntoNuevo.symbol = markerSymbol;

    var existe = false;
    var i = 0;
    while ((i<puntos.length)&&(!existe)){
    	if (puntoNuevo.name == puntos[i].name){
    		existe = true;
    	}
    	i++;
    }

  	if (!existe){
    	puntos.push(puntoNuevo);

      // Oculta cartel de la lista
      if (puntos.length>1){
        $(dom.byId("rutaBtn")).prop('disabled', false);
      }else if (puntos.length<=1){
          $(dom.byId("rutaBtn")).prop('disabled', true);
      }
      if (puntos.length>0){
      	$(dom.byId("listMsj")).prop('hidden', true);
      }else if (puntos.length==0){
      	$(dom.byId("listMsj")).prop('hidden', false);
      }

      $(dom.byId("guardarPtosBtn")).prop('disabled', false);
      $(dom.byId("borrarPtosBtn")).prop('disabled', false);

      // Agregar un stop a la ruta a calcular
      routeParams.stops.features.push(
        // Dibuja punto en el mapa
        map.graphics.add(
          new Graphic(puntoNuevo.geometry, puntoNuevo.symbol)
        )
      )
      actualizarPuntos();
  	}
  }

  // Botón Guardar Puntos: Guarda los puntos ingresados por el usuario en el servidor
  on(dom.byId("guardarPtosBtn"), "click", guardarPuntos);
  function guardarPuntos(){
    puntos.forEach(function(puntoNuevo) {
        var attributes =  {
        "event_type": '13',
        "description": puntoNuevo.name
        }
        var puntoSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE);
        puntoSymbol.setColor(new Color("#DF3A01"));
        puntoSymbol.setSize(15);
        var newGraphic = new Graphic(puntoNuevo.geometry, puntoSymbol, attributes);
        pointsFL.applyEdits([newGraphic], null, null);
      });
  }

  on(dom.byId("cargarPtosBtn"), "click", cargarPuntos);
  function cargarPuntos() {
    //Filtrar capa de puntos.
    var query = new Query();
    // query.where = "description = 'grupo04_puntos'";
    query.where = "event_type = '13'";
    pointsFL.selectFeatures(query);
    pointsFL.on("selection-complete", cargoPuntosServicio)

    // Se dibujan los puntos obtenidos en la query del servicio
    function cargoPuntosServicio(response){
      if (response.features.length == 0){
        alert("No hay puntos disponibles");
      }else{
        var features = response.features;
        for (var i = 0; i < features.length; i++) {

          // Creo el punto cargado
          var puntoNuevo = new Object();
          puntoNuevo.name = features[i].attributes.description;
          puntoNuevo.geometry = features[i].geometry;
          puntoNuevo.symbol = features[i].symbol;

          // Miramos si existia
          var existe = false;
          var j = 0;
          while ((j<puntos.length)&&(!existe)){
            if (puntoNuevo.name == puntos[j].name){
              existe = true;
            }
            j++;
          }

          // Sino existe lo guardo y lo muestro en el mapa
          if (!existe){
            puntos.push(puntoNuevo);

            // Agregar un stop a la ruta a calcular
            routeParams.stops.features.push(
              //dibuja punto en el mapa
              map.graphics.add(
                new Graphic(
                  puntoNuevo.geometry,
                  puntoNuevo.symbol
                )
              )
            )
            // Agrego al mapa
            puntosServicioLayer.add(new Graphic(puntoNuevo.geometry, puntoNuevo.symbol));
          }
        }

        map.addLayer(puntosServicioLayer);

        actualizarPuntos();

        // Oculta cartel de la lista
        if (puntos.length>1){
          $(dom.byId("rutaBtn")).prop('disabled', false);
        }else if (puntos.length<=1){
            $(dom.byId("rutaBtn")).prop('disabled', true);
        }
        if (puntos.length>0){
          $(dom.byId("listMsj")).prop('hidden', true);
        }else if (puntos.length==0){
          $(dom.byId("listMsj")).prop('hidden', false);
          $(dom.byId("rutaBtn")).prop('disabled', true);
        }

        $(dom.byId("guardarPtosBtn")).prop('disabled', false);
        $(dom.byId("borrarPtosBtn")).prop('disabled', false);
      }
    }

  }

  var geometryService = new esri.tasks.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
  // Capa donde se dibuja el móvil
  var movilLayer = new GraphicsLayer();

  on(dom.byId("startBtn"), "click", startSimulacion);
  function startSimulacion(){
      var cantPtosRta = 10;
      $("#startBtn").prop('disabled', true);
      $('#stopBtn').prop('disabled', false);
      $('#ptosList').prop('hidden',true);
      $('#infoList').prop('hidden',false);

      $('.panel div.clickable').click();

      iter = 0;
      // Comenzar timer.
      setTimeout(moverMovil, 100);
      terminarSimulacion = false;
  }

  var radio_buffer;

  var nombre_estado;
  // Funcion para mover el movil
  var colorBuffer = new dojo.Color([0, 0, 255, 0.15]); 
  function moverMovil(){
    // Para pedir condados y poblacion
    var queryTaskCounties = new QueryTask("http://services.arcgisonline.com/ArcGIS/rest/services/Demographics/USA_1990-2000_Population_Change/MapServer/3");
    var queryTaskStates = new QueryTask("http://services.arcgisonline.com/ArcGIS/rest/services/Demographics/USA_1990-2000_Population_Change/MapServer/4");

    if (!terminarSimulacion){
        // Si llegué al final o me pase de la cantidad de puntos entonces llegue al final
        if (iter >= routes[0].geometry.paths[0].length - 1){
          iter = routes[0].geometry.paths[0].length - 1;
          terminarSimulacion = true;
        }

        // Punto siguiente del móvil.
        xsig = routes[0].geometry.paths[0][iter][0];
        ysig = routes[0].geometry.paths[0][iter][1];
        var ptoSig = new Point(xsig,ysig,map.spatialReference)

	    	if($("#myonoffswitch").is(':checked')) {
          if ($('#p')[0].checked)
            map.centerAndZoom(ptoSig, 10);
          else if ($('#m')[0].checked)
          	map.centerAndZoom(ptoSig, 9);
          else if ($('#g')[0].checked)
          	map.centerAndZoom(ptoSig, 8);
	    	}
        movilLayer.clear();
        // Se dibuja el movil en el mapa.
        movilLayer.add(new Graphic(ptoSig, movilSymbol));

        // El salto es proporcional a la cantidad de puntos que tenga la ruta
        salto = parseInt(routes[0].geometry.paths[0].length/60); //Saltos
        iter = iter + salto;

        // Dibujar buffer en el móvil
        var params = new esri.tasks.BufferParameters();
        params.geometries = [ptoSig];

        // Tamaño del buffer
        if ($('#p')[0].checked)
        	radio_buffer = 10;
        else if ($('#m')[0].checked)
        	radio_buffer = 25;
        else if ($('#g')[0].checked)
        	radio_buffer = 50;

        params.distances = [radio_buffer];
        params.unit = 9036;
        params.outSpatialReference = {"wkid":102100};

        geometryService.buffer(params, mostrarBuffer);


        function mostrarBuffer(geometries) {
          var bufferMovil = geometries[0];

          // Query States movil
          var queryStates = new Query();
          queryStates.returnGeometry = true;
          queryStates.outFields = ["ST_ABBREV","NAME"];
          queryStates.geometry = ptoSig;
          queryStates.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;

          queryTaskStates.execute(queryStates);
          queryTaskStates.on("error", function(err){
            console.log("No se pudo obtener el state : " + err);
          });

          queryTaskStates.on("complete", function(evt) {
            // Estado en el que se encunetra el punto
            stateAnterior = stateActual;
            stateActual = evt.featureSet.features[0].attributes.ST_ABBREV;
            // Verificar cambio de estado
            if ((stateAnterior != stateActual) && stateAnterior != ""){
              // Cambiar color buffer
              if(color_actual == 1){
                color_actual = 2;
                colorBuffer = new dojo.Color([0, 255, 0, 0.15])
              }else{
                color_actual = 1;
                colorBuffer = new dojo.Color([0, 0, 255, 0.15])
              }
              // Reproducir sonido al camiar de estado
              playSound(14);
            }

            var symbol = new esri.symbol.SimpleFillSymbol(
              SimpleFillSymbol.STYLE_SOLID,
              new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,colorBuffer, 2), colorBuffer);

            dojo.forEach(geometries, function(geometry) {
              var graphic = new esri.Graphic(geometry,symbol);
              movilLayer.add(graphic);
              movilLayer.add(new Graphic(ptoSig, movilSymbol));
            });

            nombre_estado = evt.featureSet.features[0].attributes.NAME;
          });

          // Query Counties overlap buffer
          var queryCounties = new Query();
          queryCounties.returnGeometry = true;
          queryCounties.outFields = ["NAME","TOTPOP_CY","LANDAREA", "ST_ABBREV"];
          queryCounties.geometry = bufferMovil;
          queryCounties.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
          queryCounties.outSpatialReference = {"wkid":102100};

          var interseccion = queryTaskCounties.execute(queryCounties);

          queryTaskCounties.on("error", function(err){
            alert(err)
          });

          queryTaskCounties.on("complete", function(evt) {
            var total_population = 0;
            var pop_inter_countie = 0;
            var counties = "";
            var fset = evt.featureSet;
            var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,
                            new SimpleLineSymbol(SimpleFillSymbol.STYLE_SOLID,
                              new Color([10, 180, 10]), 3));

            var resultFeatures = fset.features;
            var popTotal = 0;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
          	  var graphic = resultFeatures[i];
              var name = graphic.attributes.NAME;

              // Convertir millas^2 a km^2
              var area_countie = Math.ceil(graphic.attributes.LANDAREA * 2,58998811);
     				  pop_countie = graphic.attributes.TOTPOP_CY;

     				  var inter = GeometryEngine.intersect(bufferMovil,graphic.geometry);
     				  var area_interseccion = Math.ceil(GeometryEngine.geodesicArea(inter,109414));

              // Calculo de poblacion en la interseccion
     				  total_population+= Math.ceil((area_interseccion*pop_countie)/area_countie);
              pop_inter_countie = Math.ceil((area_interseccion*pop_countie)/area_countie);
              var num = i+1;
              counties+= name + ": " + pop_inter_countie + " / " + pop_countie + "<br/>";

              graphic.setSymbol(symbol);
              movilLayer.add(graphic);
              movilLayer.add(new Graphic(ptoSig, movilSymbol));
            }

            var tipoRadio;
            if ($('#p')[0].checked)
            	tipoRadio = "Pequeño";
            else if ($('#m')[0].checked)
            	tipoRadio = "Mediano" ;
            else if ($('#g')[0].checked)
            	tipoRadio = "Grande" ;

            $('#infoSimu').empty();
            $("<b> Estado: </b>"+nombre_estado+ "<br/>"
              + "<b>Condado : Pob en buffer / Pob Total: </b><br/>"
              + counties
              + "<b>Total población en buffer: </b>" + total_population +" hábitantes <br/>").appendTo( "#infoSimu" );
          });

        }

        // Se dibuja la capa con el móvil y el buffer
        map.addLayer(movilLayer);

        var velocidad;

        if ($('#vbaja')[0].checked){
          playSound(41);
          velocidad = 6000;
          movilSymbol.setColor(new Color("#04B4AE"));
        }else if ($('#vmedia')[0].checked){
          playSound(42);
          velocidad = 5000;
          movilSymbol.setColor(new Color("#8000FF"));
        }else if ($('#valta')[0].checked){
          playSound(43);
          velocidad = 4000;
          movilSymbol.setColor(new Color("#FF4500"));
        }
        // Velocidad del móvil
        setTimeout(moverMovil, velocidad);

    }else{
        alert("Simulación terminada")
    }

  }

  on(dom.byId("stopBtn"), "click", stopSimulacion);

  function stopSimulacion(){
    terminarSimulacion = true;
    $('#stopBtn').prop('disabled', true);
    $('#startBtn').prop('disabled', false);
    $('#borrarRutaBtn').prop('disabled', false);
    $('#ptosList').prop('hidden',false);
    $('#infoList').prop('hidden',true);
  }

  // FeatureLayer para cargar rutas del servidor
  var trailsFL = FeatureLayer("http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1", {
    mode: FeatureLayer.MODE_SNAPSHOT,
    outFields: ["*"]});

  // Guardar ruta
  on(dom.byId("guardarRutaBtn"), "click", guardarRuta);
  function guardarRuta(){
    var nombre_ruta = "grupo04_rutas_"+$("#selectedRoute	 option:selected")[0].value;
    // Guardar la ruta seleccionada.
    var attributes =  {
      "trailtype":4,
      "notes": nombre_ruta
    }
    var newGraphic = new Graphic(routes[0].geometry,routeSymbol,attributes);
    // Aplico cambios en el servicio
    trailsFL.applyEdits([newGraphic], null, null);

  }

  // Cargar ruta seleccionada
  on(dom.byId("cargarRutaBtn"), "click", cargarRuta);
  function cargarRuta(){
    var rutaSeleccionada = $("#selectedRoute option:selected")[0].value;

    //Filtrar rutas del servidor
    var query = new Query();
    var note = "grupo04_rutas_"+rutaSeleccionada
    query.where = "notes = '"+ note +"'";
    query.outSpatialReference = {"wkid":102100};
    trailsFL.selectFeatures(query);

    trailsFL.on("selection-complete", dibujarRutaCargada)

    // Capa donde se ponen los puntos filtrados del servicio
    rutaServicioLayer = new GraphicsLayer({opacity:0.9});

    // Se dibuja la ruta obtenida en la query del servicio
    function dibujarRutaCargada(response){
      if (response.features.length == 0){
        alert("La ruta seleccionada no esta disponible");
      }else{
        // Si había ruta cargada, se borra.
        borrarRutas();
        borrarPuntos();
        routeGraphicLayer.clear();
        movilLayer.clear();

        if ((response!=null) && (response.features.length>0)){
        	 $(dom.byId("startBtn")).prop('disabled', false);
           $(dom.byId("borrarRutaBtn")).prop('disabled', false);
        }

        // Se carga la nueva ruta.
        array.forEach(response.features, function(featureResult, i) {
          routes.push(
            map.graphics.add(
              featureResult.setSymbol(routeSymbol)
              )
            );
          rutaServicioLayer.add(featureResult.setSymbol(routeSymbol));
        });
        map.addLayer(rutaServicioLayer);

      }
    }
  }
}
    });

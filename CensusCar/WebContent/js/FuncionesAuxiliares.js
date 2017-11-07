function updatePointsList() {
  document.getElementById("listaPuntos").innerHTML="";
  var j = 0;
  while (j < points.length){
      var div = document.createElement('div');
      div.setAttribute( 'class', 'list-items' );
      div.innerHTML = "<span>" + j + ". " + points[j].name + "</span>";
      var li = document.createElement('li');
      li.id = j;
      var btnDeletePoint = document.createElement('button');
      btnDeletePoint.setAttribute( 'class', 'btn btn-primary btn-link' );
      btnDeletePoint.id = "btn_" + j;
      btnDeletePoint.setAttribute( 'onclick', "eliminarPto(" + j + ")" );
      btnDeletePoint.setAttribute( 'style', 'margin-right:5px');
      var trash = document.createElement('i');
      trash.setAttribute( 'class', 'glyphicon glyphicon-trash');
      btnDeletePoint.appendChild(trash);
      div.appendChild(btnDeletePoint);
      if(j > 0){
      var btnUp = document.createElement('button');
      btnUp.setAttribute( 'class', 'btn btn-primary btn-link' );
      btnUp.id = "btnUp_" + j;
      btnUp.setAttribute( 'onclick', "goUpPoint(" + j + ")" );
      //btnUp.setAttribute( 'style', 'float:right');
      var arrowUp = document.createElement('i');
      arrowUp.setAttribute( 'class', 'glyphicon glyphicon-arrow-up');
      btnUp.appendChild(arrowUp);
      div.appendChild(btnUp);
      }
      if(j < points.length -1){
      var btnDown = document.createElement('button');
      btnDown.setAttribute( 'class', 'btn btn-primary btn-link' );
      btnDown.id = "btnDown_" + j;
      btnDown.setAttribute( 'onclick', "goDownPoint(" + j + ")" );
      //btnDown.setAttribute( 'style', 'float:right');
      var arrowDown = document.createElement('i');
      arrowDown.setAttribute( 'class', 'glyphicon glyphicon-arrow-down');
      btnDown.appendChild(arrowDown);
      div.appendChild(btnDown);
      }
      li.appendChild(div);
      document.getElementById("listaPuntos").appendChild(li);
      j++;
  }
}

function goUpPoint(id){
  //intercambiar puntos
  var aux = points[id];
  points[id] = points[id-1];
  points[id-1] = aux;
  //actualizar lista puntos web
  updatePointsList();
}

function goDownPoint(id){
  //intercambiar puntos
  var aux = points[id];
  points[id] = points[id+1];
  points[id+1] = aux;
  //actualizar lista puntos web
  updatePointsList();
}

function eliminarPto(id){
  // saca el punto del array de puntos
    points.splice(id,1);

  // Saca el punto de los stops
  pointsLayer.remove(pointsLayer.graphics.items[id]);

  updatePointsList();
}

$(document).ready(function() {
  $('#infoList').prop('hidden',true);
});

function addRouteToList(){
  $('#list-Routes').empty();
  var j = 0;
  while (j < routesArray.length){
    var name = routesArray[j].replace("SigGroup12_", "").replace(/_/g, " => ");
    if (name.localeCompare("SigGroup12") !=0){
      $("<div class=" + "list-items" + " onclick="+"upLoadRoute("+j+")" + " id=" + "elem_" + j + ">"+ name + "</div>").appendTo( "#list-Routes" );
    }
    j++;
  }
}

function insertRouteToList(routeName){
    if (routeName.localeCompare("SigGroup12") !=0){
        $("<div class=" + "list-items" + " onclick="+"upLoadRoute("+routesArray.length()-1+")" + " id=" + "elem_" + routesArray.length()-1 + ">"+ routeName + "</div>").appendTo( "#list-Routes" );
      }
}

 /*  function upLoadRoute(j){
      selectedRoute = routesArray[j].replace(/ => /g, "_");
      var url = queryRoutesURL + selectedRoute + queryRoutesURLEnd
      $.ajax({
        type: "POST",
        url: url,
        //data: data,
        success: (response) => {
          addressResult = response.features;
          routesLayer.add(addressResult);
          console.log(addressResult);
        },
        dataType: "json",
        async: false
      });
  } */
function upLoadRoute(j){
    selectedRoute = routesArray[j].replace(/ => /g, "_");
    var url = queryRoutesURL + selectedRoute + queryRoutesURLEnd
    var routeResponse
    $.ajax({
      type: "POST",
      url: url,
      //data: data,
      success: (response) => {
        routeResponse = response;
        /*var routeSelected = {
          geometry: routeResult[0].geometry,
          symbol: routeStyle 
      }*/
      /*console.log("routeSelected");
      console.log(routeSelected);
      routesLayer.add(routeSelected);
        console.log(routeResult);*/
      },
      dataType: "json",
      async: false
    });
    
    /*  query.where = `notes = 'SigGroup12_${selectedRoute}'`;
      query.returnGeometry = true;
      query.outSpatialReference = { wkid: 102100 };
    routesFeatureLayer.queryFeatures(query)
    .then(featureSet =>{
        var routeResult = {
            geometry: featureSet.features[0].geometry,
            symbol: routeStyle
        };
        console.log("routeResult");
        console.log(routeResult);
          routesLayer.removeAll();
        routesLayer.add(routeResult);

    })
    .catch (err => {
        console.log("Load Route: ", err);
        showToast(`Error al cargar la ruta ${name}`, "error");
    })*/
  //  console.log("routeResponse: "+routeResponse);
   // routeResponse.symbol = routeStyle;
   routeResponse.features[0].geometry.type = "polyline";  
   
  var polylineAtt = {
    Name: "Keystone Pipeline",
    Owner: "TransCanada"
  }
  var polyline = {
    type: "polyline",  // autocasts as new Polyline()
      paths: routeResponse.features[0].geometry.paths,
      spatialReference: { wkid: 102100 }
  };
  //var selectedRouteGraphic= setGraphic();
  //var selectedRouteGraphic = new Graphic();
  selectedRouteGraphic.geometry= polyline;
  selectedRouteGraphic.attributes = polylineAtt;
   //selectedRouteGraphic.geometry.type= "polyline";
   selectedRouteGraphic.symbol = routeStyle; 
  

  var routeSelected={
    geometry: routeResponse.features[0].geometry,
    symbol: routeStyle
  };

  console.log("selectedRouteGraphic");
  console.log(selectedRouteGraphic);
  routesLayer.removeAll();
  routesLayer.add(selectedRouteGraphic);

}

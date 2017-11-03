function updateStopsList() {
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
        btnUp.setAttribute( 'onclick', "subirPto(" + j + ")" );
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
        btnDown.setAttribute( 'onclick', "bajarPto(" + j + ")" );
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

function subirPto(id){
    //intercambiar puntos
    var aux = points[id];
    points[id] = points[id-1];
    points[id-1] = aux;
    //actualizar lista puntos web
    updateStopsList();
}

function bajarPto(id){
    //intercambiar puntos
    var aux = points[id];
    points[id] = points[id+1];
    points[id+1] = aux;
    //actualizar lista puntos web
    updateStopsList();
}

function eliminarPto(id){
    // saca el punto del array de puntos
      points.splice(id,1);
  
    // Saca el punto de los stops
    pointsLayer.remove(pointsLayer.graphics.items[id]);
  
    updateStopsList();
  }
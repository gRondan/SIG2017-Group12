function playSound(id) {
  var sound=document.getElementById('beep-'+id);
  if (sonido){
    sound.play();
  }
}

// Expandir y contraer menu
$(document).on('click', '.panel-heading span.clickable', function (e) {
    var $this = $(this);
    if (!$this.hasClass('panel-collapsed')) {
        $this.parents('.panel').find('.panel-body').slideUp();
        $this.addClass('panel-collapsed');
        $this.find('i').removeClass('glyphicon-minus').addClass('glyphicon-plus');
    } else {
        $this.parents('.panel').find('.panel-body').slideDown();
        $this.removeClass('panel-collapsed');
        $this.find('i').removeClass('glyphicon-plus').addClass('glyphicon-minus');
    }
});

$(document).on('click', '.panel div.clickable', function (e) {
    var $this = $(this);
    if (!$this.hasClass('panel-collapsed')) {
        $this.parents('.panel').find('.panel-body').slideUp();
        $this.addClass('panel-collapsed');
        $this.find('i').removeClass('glyphicon-minus').addClass('glyphicon-plus');
    } else {
        $this.parents('.panel').find('.panel-body').slideDown();
        $this.removeClass('panel-collapsed');
        $this.find('i').removeClass('glyphicon-plus').addClass('glyphicon-minus');
    }
});


// Inicializa botones deshabilitados
$(document).ready(function() {
    $('#rutaBtn').prop('disabled', true);
    $('#borrarRutaBtn').prop('disabled', true);
    $('#guardarRutaBtn').prop('disabled', true);
    $('#guardarPtosBtn').prop('disabled', true);
    $('#borrarPtosBtn').prop('disabled', true);
    $('#startBtn').prop('disabled', true);
    $('#stopBtn').prop('disabled', true);
    $('#infoList').prop('hidden',true);
    $('#soundOff').prop('disabled',true);
});

function habilitarSonido(){
  $('#soundOn').prop('disabled',false);
  $('#soundOff').prop('disabled',true);
  sonido = true;
}
function deshabilitarSonido(){
  $('#soundOn').prop('disabled',true);
  $('#soundOff').prop('disabled',false);
  sonido = false;
}
function actualizarPuntos(){
  $('#listaPtos').empty();
  //PlaySound(7);
  var j = 0;
  while (j<puntos.length){

    $("<div class=" + "list-items"+" id=" + "elem_" + j + ">"+ j + " " + puntos[j].name + "</div>").appendTo( "#listaPtos" );
    $("<button class=" + "'btn btn-primary btn-link'" +" id=" + "btn_" + j + " onclick="+"eliminarPto("+j+") style=\"float:right;margin-right:5px\""+"><i class=\"glyphicon glyphicon-trash\"></i></button>").appendTo("#elem_"+j);
    if(j>0){
        $("<button class=" + "'btn btn-primary btn-link'" +" id=" + "up_btn_" + j + " onclick="+"subirPto("+j+") style=\"float:right\" "+"><i class=\"glyphicon glyphicon-arrow-up\"></i></button>").appendTo("#elem_"+j);
    }
    if(j<puntos.length-1){
        $("<button class=" + "'btn btn-primary btn-link'" +" id=" + "down_btn_" + j + " onclick="+"bajarPto("+j+") style=\"float:right\" "+"><i class=\"glyphicon glyphicon-arrow-down\"></i></button>").appendTo("#elem_"+j);
    }
    j++;
  }
}

function subirPto(id){
  //intercambiar puntos
  aux = puntos[id];
  puntos[id] = puntos[id-1];
  puntos[id-1] = aux;
  //intercambiar stops
  stopaux= routeParams.stops.features[id];
  routeParams.stops.features[id] = routeParams.stops.features[id-1];
  routeParams.stops.features[id-1] = stopaux;
  //actualizar lista puntos web
  actualizarPuntos();
}
function bajarPto(id){
  //intercambiar puntos
  aux = puntos[id];
  puntos[id] = puntos[id+1];
  puntos[id+1] = aux;
  //intercambiar stops
  stopaux= routeParams.stops.features[id];
  routeParams.stops.features[id] = routeParams.stops.features[id+1];
  routeParams.stops.features[id+1] = stopaux;
  //actualizar lista puntos web
  actualizarPuntos();
}

function eliminarPto(id){
  // saca el punto del array de puntos
	puntos.splice(id,1);

  // Saca el punto de los stops
  map.graphics.remove(routeParams.stops.features.splice(id, 1)[0]);

  actualizarPuntos();

  // Cartel de No hay puntos
  if (puntos.length==0){
		$("#listMsj").prop('hidden', false);
    $("guardarPtosBtn").prop('disabled', true);
    $("borrarPtosBtn").prop('disabled', true);
	}else{
		$("#listMsj").prop('hidden', true);
	}
	if (puntos.length>1){
		$("#rutaBtn").prop('disabled', false);
	}else{
		$("#rutaBtn").prop('disabled', true);
	}
}
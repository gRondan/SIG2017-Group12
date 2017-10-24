//Variables globales


//Dependencias
require[
    "esri/widgets/Search"
],

//Funciones
searchWidget.on("search-complete", function(event){
    // The results are stored in the event Object[]
    console.log("Results of the search: ", event);
  });
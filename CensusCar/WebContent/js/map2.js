dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.map");
var map;
function init() {
    map = new esri.Map("map");
          var layer = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer");
          map.addLayer(layer);
    var resizeTimer;
    dojo.connect(map, 'onLoad', function(theMap) {
      dojo.connect(dijit.byId('map'), 'resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
          map.resize();
          map.reposition();
         }, 500);
       });
     });
    }
dojo.addOnLoad(init);
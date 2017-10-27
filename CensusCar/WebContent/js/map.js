var djConfig = { parseOnLoad: true }
var map;



require(["esri/widgets/Search","dijit.layout.BorderContainer","dijit.layout.ContentPane","esri.map"],
    function (Search,BorderContainer,ContentPane,map) {
        function init() {
            map = new esri.Map("map");
            var layer = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer");
            map.addLayer(layer);
            var resizeTimer;
            dojo.connect(map, 'onLoad', function (theMap) {
                dojo.connect(dijit.byId('map'), 'resize', function () {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(function () {
                        map.resize();
                        map.reposition();
                    }, 500);
                });
            });

        }
        dojo.addOnLoad(init);
        var searchWidget = new Search({
            map: map
        })

        map.ui.add(searchWidget, {
            position: "top-left",
            index: 2
        })
    })


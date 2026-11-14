// Pagina HTML con mappa Leaflet + OpenStreetMap (sfondo chiaro CARTO), mostrata in una WebView.
// Nessuna chiave API necessaria. Comunica con l'app tramite postMessage.

export type MapPoint = { id: string; name: string; lat: number; lon: number; color: string };

export const MAP_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #F3F8FC; }
  .lbl {
    background: rgba(255,255,255,0.92); border: 1px solid #DCE7F1; border-radius: 6px;
    padding: 1px 5px; font: 600 11px -apple-system, Roboto, sans-serif; color: #0F2233;
    box-shadow: none; white-space: nowrap;
  }
  .lbl:before { display: none; }
  .hide-labels .lbl { display: none; }
  .sel { background: #1E6FD9; color: #fff; border-color: #1E6FD9; display: block !important; }
  .leaflet-control-attribution { font-size: 9px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var send = function (o) { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(o)); };
  var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([46.75, 8.25], 7);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertile_voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 18, subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);

  var layer = L.layerGroup().addTo(map);
  var markers = {};
  var selected = null;

  function updateLabels() {
    // i nomi compaiono quando si ingrandisce, per non coprire la mappa
    var el = document.getElementById('map');
    if (map.getZoom() >= 9) el.classList.remove('hide-labels'); else el.classList.add('hide-labels');
  }
  map.on('zoomend', updateLabels);
  map.on('click', function () { select(null); send({ type: 'select', id: null }); });

  function select(id) {
    if (selected && markers[selected]) {
      markers[selected].setRadius(7);
      var t0 = markers[selected].getTooltip(); t0 && t0.getElement() && t0.getElement().classList.remove('sel');
    }
    selected = id;
    if (id && markers[id]) {
      var m = markers[id];
      m.setRadius(11); m.bringToFront();
      var t = m.getTooltip(); t && t.getElement() && t.getElement().classList.add('sel');
    }
  }

  window.setPoints = function (points, selectedId) {
    layer.clearLayers(); markers = {};
    points.forEach(function (p) {
      var m = L.circleMarker([p.lat, p.lon], {
        radius: 7, color: '#ffffff', weight: 2, fillColor: p.color, fillOpacity: 1
      });
      m.bindTooltip(p.name, { permanent: true, direction: 'top', offset: [0, -8], className: 'lbl' });
      m.on('click', function (e) {
        L.DomEvent.stopPropagation(e);
        select(p.id);
        send({ type: 'select', id: p.id });
      });
      m.addTo(layer);
      markers[p.id] = m;
    });
    updateLabels();
    if (selectedId) select(selectedId);
  };

  window.focusPoint = function (id) {
    var m = markers[id]; if (!m) return;
    map.setView(m.getLatLng(), Math.max(map.getZoom(), 10));
    select(id);
  };

  send({ type: 'ready' });
</script>
</body>
</html>`;

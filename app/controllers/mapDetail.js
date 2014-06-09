var args = arguments[0] || {};

// Set the region for the map based on the fugitive's location.
$.mapView.applyProperties({
  region: {
    latitude: args.lat,
    longitude: args.lon,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1
  }
});

// Create annotation and set on map.
var fugitiveAnnotation = Alloy.Globals.Map.createAnnotation({
  latitude: args.lat,
  longitude: args.lon,
  title: args.fugitiveName,
  subtitle: 'Busted',
  pincolor: Alloy.Globals.Map.ANNOTATION_RED,
});
$.mapView.addAnnotation(fugitiveAnnotation);

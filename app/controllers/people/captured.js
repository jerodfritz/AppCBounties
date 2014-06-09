var args = arguments[0] || {};

// Access fugitives collection.
var fugitives = Alloy.Collections.fugitives;
fugitives.fetch();

// Functions //
function fugitivesCaptured(collection) {
  return collection.where({captured:1});
}

// Release bindings when window is closed.
$.win.addEventListener('close', function() {
  $.destroy();
});
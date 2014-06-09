var args = arguments[0] || {};

// Access fugitives collection.
var fugitives = Alloy.Collections.fugitives;
fugitives.fetch();

// Functions.
function addNew() {
  var addFugitiveController = Alloy.createController('addFugitive');
  var addFugitiveView = addFugitiveController.getView();
  addFugitiveView.open({
    modal: true
  });
};

function fugitivesAtLarge(collection) {
  return collection.where({captured:0});
}

// Release bindings when window is closed.
$.winFugitives.addEventListener('close', function() {
  $.destroy();
});
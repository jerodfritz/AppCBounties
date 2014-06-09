var args = arguments[0] || {};
args.model = args.model || {};

Ti.API.info('args passed to fugitive detail window');
Ti.API.info(JSON.stringify(args));



////////////////////////////////////////
// Window initialization.
////////////////////////////////////////

// Get data from model.
var title = args.model.get('name');
var captured = args.model.get('captured');
var photoPath = args.model.get('url');
var lat = args.model.get('capturedLat');
var lon = args.model.get('capturedLon');
var capturedText = (captured === 1) ? 'Captured' : 'At Large';

// Populate window.
$.win.setTitle(title);
$.labelStatus.setText(capturedText);

// If a url is stored
if (photoPath) {
  $.fugitiveImage.setImage(photoPath);
}

// Enable capture button if fugitive is still at large.
if (captured === 0) {
  $.buttonCapture.setEnabled(true);
}

// Enable map button if coordinates are available.
if (_.isNumber(lat) && _.isNumber(lon)) {
  $.buttonViewMap.setEnabled(true);
}



////////////////////////////////////////
// Event Listeners.
////////////////////////////////////////
$.win.addEventListener('open', eventWinOpen);
$.win.addEventListener('close', eventWinClose);



////////////////////////////////////////
// Functions.
////////////////////////////////////////

/**
* Destroy window elements.
*/
function eventWinClose() {
  $.win.removeEventListener('open', eventWinOpen);
  $.win.removeEventListener('close', eventWinClose);
  $.win = null;
}

/**
* Add back button when opened on Android.
*
* @param e
*   Window object.
*/
function eventWinOpen(e) {
  if (OS_ANDROID) {
    // If this window has an activity, add a back button.
    if ($.win.activity) {
      Ti.API.info('detected activity');
      var actionBar = this.activity.actionBar;
      if (actionBar) {
        actionBar.displayHomeAsUp = true;
        actionBar.onHomeIconItemSelected = function() {
          $.win.close();
        };
      }
    }
  }
}

/**
* Show delete dialog.
*/
function showDeleteAlert(e) {
  $.dialogDelete.show();
}

/**
* Delete fugitive.
*/
function confirmDelete(e) {
  // Only delete if this user confirms deletion.
  if (e.index === 0) {
    $.win.close();
    args.model.destroy();
  }
}

/**
* Open the map view.
*/
function showMapView(e) {
  var mapDetailController = Alloy.createController('mapDetail', {
    lat: lat,
    lon: lon,
    fugitiveName: title
  });
  var mapDetailView = mapDetailController.getView();

  if (OS_IOS) {
    Alloy.Globals.tabGroup.activeTab.open(mapDetailView);
  }
  if (OS_ANDROID) {
    mapDetailView.open();
  }
}

/**
* Capture a fugitive.
*/
function eventClickCapture() {
  // Set the purpose of the location services.
  Ti.Geolocation.purpose = "Tracking down criminal scum";

  if (Ti.Geolocation.getLocationServicesEnabled() === false) {
    alert('Location services are not currently enabled. Please enable and capture again.');
    return;
  }

  // Define location accuracy.
  if (OS_IOS) {
    Ti.Geolocation.accuracy = Titanium.Geolocation.ACCURACY_BEST;
  }
  if (OS_ANDROID) {
    Ti.Geolocation.accuracy = Titanium.Geolocation.ACCURACY_HIGH;
  }

  /**
  * React to position detection.
  */
  function updateAndSaveFugitive(e) {
    Alloy.Globals.loading.hide();

    e = e || {};
    e.coords = e.coords || {};

    if (e.success === true && _.isNumber(e.coords.latitude) && _.isNumber(e.coords.longitude)) {
      args.model.save({
        captured: 1,
        capturedLat: e.coords.latitude,
        capturedLon: e.coords.longitude
      });
      $.dialogCapture.setMessage("You successfully captured a fugitive.");
    }
    else {
      // No coordinates detected, just save the fugitive.
      args.model.save({
        captured: 1
      });
      $.dialogCapture.setMessage("We could not detect his coordinates, but you still successfully captured a fugitive.");
    }

    // Show the capture dialog.
    $.dialogCapture.show();
  }

  // Get the current position.
  Alloy.Globals.loading.show('Determining location', false);
  setTimeout(function() {
    Ti.Geolocation.getCurrentPosition(updateAndSaveFugitive);
  }, 3000);
}

/**
* Close the window.
*/
function closeWindow() {
  $.win.close();
}

/**
* Allow the user to select where the image
* should be selected from.
*/
function showImageOptions() {
  $.optionDialogImage.show();
}

/**
* Store the photo in a directory on the filesystem.
*
* @param e.blob
*   Blob to store on the file system.
* @param e.filename
*   Name to use for file storage.
*/
function storeFile(e, callback) {
  e = e || {};
  callback = callback || function() {};
  var fileTools = require('fileTools');
  // Ensure blob and filename are available.
  if (_.isUndefined(e.blob) || _.isUndefined(e.filename)) {
    callback(true, null);
  }

  // Determine the extension.
  var fileExtension = fileTools.getFileTypeFromBlob(e.blob);
  var filename = 'photo-' + String(e.filename) + '.' + fileExtension;
  var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, filename);
  file.write(e.blob);
  Ti.API.info('Successfully wrote file. nativePath = ' + file.getNativePath());

  // Nullify stuff.
  e.blob = null;
  callback(null, file);
}

/**
* Take the photo.
*/
function selectPhoto(e) {
  /**
  * User cancels photo selection.
  */
  function optionsCancel(e) {
    Ti.API.error('User cancelled photo upload');
  }

  /**
  * There was an error in the photo upload.
  */
  function optionError(e) {
    Ti.API.error('There was an error selecting the photo');
    alert('Your photo could not be selected. Please try again.');
  }

  /**
  * Successful photo selection.
  */
  function optionSuccess(e) {
    e = e || {};
    if (e.media) {
      storeFile({
        blob: e.media,
        filename: args.model.id
      }, function(error, file) {
        if (error) {
          alert('Something went wrong. Please try again later.');
          return;
        }

        // Store the native path as the url in the fugitive model.
        args.model.save({
          url: file.getNativePath()
        });

        // Set the stored blob in the image view.
        $.fugitiveImage.setImage(file.read());
      });
    }
  }

  // Define options for both taking a new photo
  // and selecting the photo from the gallery.
  var options = {
    allowEditing: true,
    mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO],
    cancel: optionsCancel,
    error: optionError,
    success: optionSuccess
  };

  switch (e.index) {
  case 0:
    // Upload from photo gallery.
    Ti.Media.openPhotoGallery(options);
    break;

  case 1:
    // Upload from camera. Ensure this is not a simulator.
    if (Titanium.Platform.model == 'google_sdk' || Titanium.Platform.model == 'Simulator') {
      alert('You cannot take a photo on the simulator');
      return;
    }

    Ti.Media.showCamera(options);
    break;
  }
}

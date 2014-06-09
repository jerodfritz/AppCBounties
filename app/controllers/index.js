// Determine if the database has already been seeded.
// Only seed the database once.
var seeded = Ti.App.Properties.hasProperty('seeded');
Ti.API.info('seeded: ' + seeded);

// Access the existing fugitives collection.
var fugitives = Alloy.Collections.fugitives;
fugitives.fetch();

// Show the contents of each collections.
fugitives.each(function(fugitive, index) {
  Ti.API.info('fugitive #' + index + ': ' + fugitive.get('name'));
});

// ==========================================
// Function Declarations
// ==========================================

/**
 * HTTP Client error callback.
 */
function httpClientError(e) {
  Ti.API.debug(e.error);
  alert('Could not populate initial list');
}

/**
 * HTTP client success callback.
 */
function httpClientSuccess(e) {
  Ti.API.info("Received text: " + this.responseText);

  populateFugitives(JSON.parse(this.responseText), function(err, fugitives) {
    if (err) {
      Ti.API.error(err);
      return;
    }

    // Set our app property so this code doesn't run next time.
    Ti.API.info('Initial seeding completed, added: ' + fugitives.length);
    Ti.App.Properties.setString('seeded', 'yuppers');
  });
}

/**
 * Create fugitive models and add to collection.
 *
 * @param fugitives
 *   Array of fugitives.
 * @param callback
 *   Callback function.
 */
function populateFugitives(fugitives, callback) {
  fugitives = fugitives || [];
  if (_.isEmpty(fugitives)) {
    if (_.isFunction(callback)) {
      callback('Fugitives needs to be an array');
    }
    Ti.API.error('Fugitives needs to be an array');
  }

  // Loop through the fugitives array to create a model
  // representing each and save it to the collection.
  _.each(fugitives, function(item) {
    Ti.API.error(JSON.stringify(item));
    item = item || {};
    if (_.isUndefined(item.name)) {
      Ti.API.error('Fugitive name is not available');
    } else {
      var fugitive = Alloy.createModel('fugitives', {
        name : item.name
      });

      // Add this fugitive to the collection.
      var collection = Alloy.Collections.fugitives;
      collection.add(fugitive);

      // Save this fugitive in the database.
      fugitive.save();
    }
  });

  if (_.isFunction(callback)) {
    callback(null, fugitives)
  }
}

if (!seeded) {
  // Instead of using this local data source for yuppies, download list from external source.

  // Load list of yuppies from external server and populate.
  var client = Ti.Network.createHTTPClient({
    onload : httpClientSuccess,
    onerror : httpClientError,
    timeout : 30000
  });
  client.open("GET", 'http://tools.centogram.com/bounties');
  client.send();
}

// Set the title in the Android action bar.
if (OS_ANDROID) {
  $.tabGroup.addEventListener('open', function(e) {
    // Add a title to the tab group.
    if (this.activity) {
      var actionBar = this.activity.actionBar;
      if (actionBar) {
        actionBar.title = 'Fugitives App';
        // This is already the top level. Can't get back.
        actionBar.displayHomeAsUp = false;
      }
    }

    // Create an "Add New" item.
    var activity = this.activity;
    activity.onCreateOptionsMenu = function(e) {
      var menuItemAdd = e.menu.add({
        title : "Add New",
        showAsAction : Ti.Android.SHOW_AS_ACTION_ALWAYS,
      });
      menuItemAdd.addEventListener('click', function(e) {
        var newFugitiveController = Alloy.createController('addFugitive');
        var newFugitiveWindow = newFugitiveController.getView();
        newFugitiveWindow.open();
      });
    };
    activity.invalidateOptionsMenu();
  });
}

// Store the tab group globally.
Alloy.Globals.tabGroup = $.tabGroup;

// Open the tab group.
$.tabGroup.open(); 
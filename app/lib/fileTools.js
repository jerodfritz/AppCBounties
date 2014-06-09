/**
* Determine the file type of a blob.
*
* @param blob
*   Blob that needs to be checked for the file type.
* @param callback
*   Callback function.
*/
function getFileTypeFromBlob(blob) {
  blob = blob || {};

  var mimeType = blob.getMimeType();
  var fileExtension = '';

  if (mimeType.indexOf('/')) {
    var elements = mimeType.split('/');
    fileExtension = elements[elements.length - 1];
  }

  Ti.API.error('detected file type: ' + fileExtension);

  return fileExtension;
}

/**
* Exports.
*/
exports.getFileTypeFromBlob = getFileTypeFromBlob;
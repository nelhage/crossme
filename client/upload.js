function fail(err) {
  window.the_error = err;
  alert(err);
}

function uploadFile(file) {
    var fr = new FileReader();
    fr.onerror = function() {
        fail(fr.error);
    };
    fr.onload = function() {
        Meteor.call('uploadPuzzle', fr.result);
    };
    fr.readAsBinaryString(file);
}

function handleUpload() {
  var files = $('#puzfile')[0].files;
  if (!files.length)
        return fail("You must select a file.");
  uploadFile(files[0]);
}

Template.upload.events({
  'click button': function() {
    handleUpload();
  }
});

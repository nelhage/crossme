/* global FlowRouter */

function uploadFile(file, cb) {
  const fr = new FileReader();
  fr.onerror = () => {
    cb(fr.error, null);
  };
  fr.onload = () => {
    Meteor.call('uploadPuzzle', fr.result, function (error, id) {
      cb(error, id);
    });
  };
  fr.readAsBinaryString(file);
}

export default function handleUpload(files) {
  let i = 0;
  const uploadNext = function(error, id) {
    if (error) {
      alert(`Error uploading: ${files[i].name}: ${error}`);
    } else if (i === files.length - 1) {
      FlowRouter.go('preview', { id });
    } else {
      i += 1;
      uploadFile(files[i], uploadNext);
    }
  };
  uploadFile(files[0], uploadNext);
}

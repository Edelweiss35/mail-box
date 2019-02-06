function chooseFile(){
    $("input:file").trigger("click");
}

var fileToRead = document.getElementById("file");

fileToRead.addEventListener("change", function(event) {
  var files = fileToRead.files;
  var len = files.length;
  // we should read just one file
  if (len) {
    // Show preloader
    $("#preloader").removeAttr('hidden');

    var formData = new FormData();
    formData.append("filetoupload", files[0]);

    var request = new XMLHttpRequest();
    request.open("POST", "/fileupload");
    request.onreadystatechange = function () {
      if(request.readyState === 4 && request.status === 200) {
        if(request.responseText == 'Saved'){
          $("#preloader").attr('hidden', true);
        }
      }
    };
    request.send(formData);
  }
}, false);
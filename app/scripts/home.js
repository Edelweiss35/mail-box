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
    request.timeout = 120000;
    request.onload = function () {
      // Request finished. Do processing here.
      console.log('onLoad');
    };
    
    request.ontimeout = function (e) {
      // XMLHttpRequest timed out. Do something here.
      console.log('Timeout');
    };

    request.onreadystatechange = function () {
      if(request.readyState === 4 && request.status === 200) {
        if(request.responseText == 'Finished'){
          $("#preloader").attr("hidden",true);
          window.location.href='/table';
        }
      }
    };

    request.send(formData);
  }

}, false);
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
          getRakingState();
        }
      }
    };
    request.send(formData);
  }
}, false);

function getRakingState(){
  $.get('/checkRankingState', function(result){
    if(!result.isRanking)
      setTimeout(function(){ getRakingState(); }, 1000);
    else{
      $("#preloader").attr("hidden",true);
      window.location.href='/table';
    }
  })
}
$(document).ready(function () {
  
  // Hide Spinner
  $('#spinner').removeClass('hide-opacity');

  // Setup - add a text input to each footer cell
  $('#dtBasicExample tfoot th').each( function (i) {
    var title = $(this).text();
    $(this).html( '<form class="form-inline md-form form-sm mt-0"><i class="fas fa-search" aria-hidden="true"></i><input id="col_'+i+'" class="search form-control form-control-sm ml-3 w-75" type="text" placeholder="'+title+'" aria-label="Search"></form>');
  });

  $(document).on('keyup change', "input.search",function () {
    var query = $(this).val();
    var col_index = $(this).attr('id').substring(4);
    table.column(col_index).search(query).draw();
  });

  // Init Datatable
  var table = $('#dtBasicExample').DataTable({
    "lengthMenu": [ 25, 50, 100 ],
    select: true,
    "columnDefs": [ {
      "targets": 5,
      "render": function ( data, type, full, meta ) {
        return '<a target="_blank" rel="noopener noreferrer" href="'+data+'">'+data+'</a>';
      }
    },{
      "targets": 9,
      "render": function ( data, type, full, meta ) {
        return '<a target="_blank" href="img/SS/'+data+'"><img src="img/SS/'+data+'" alt="'+data+'" style="width:150px"></a>';
      }
    },{
      "targets": 10,
      "render": function ( data, type, full, meta ) {
        return '<div class="text-left"><div class="custom-control custom-radio"><input type="radio" class="custom-control-input" id="send'+data+'" name="group'+data+'"><label class="custom-control-label" for="send'+data+'" >Send</label></div><div class="custom-control custom-radio"><input type="radio" class="custom-control-input" id="ignore'+data+'" name="group'+data+'" checked><label class="custom-control-label" for="ignore'+data+'">Ignore</label></div></div>';
      }
    } ]
  });

  $('.dataTables_length').addClass('bs-select');

  // Get CSV data from server
  $.get('/getCSVData',function(result){
    var dataSet = [];
    for( var i in result ){
        var row = [];
        var ele = result[i];
        var website = ele.Website;
        var fileName = website.slice(website.indexOf('//') + 2);
        fileName = fileName.replace('www.', '');
        fileName = fileName.replace(/\//g, '>');
        var desktopFileName = fileName + '-desktop.jpg';

        row.push(ele.Company);
        row.push(ele.City);
        row.push(ele.Region);
        row.push(ele.Phone);
        row.push(ele.Contact);
        row.push(ele.Website);
        row.push(ele.GoogleRank);
        row.push(ele.Query);
        row.push(ele.Email);
        row.push(desktopFileName);
        row.push(i);
        dataSet.push(row);
    }
    table.clear();
    table.rows.add(dataSet);
    table.draw();

    $('#spinner').addClass('hide-opacity');
    
  });

  var selectedRowData = [];
  // Table cell click event
  $('#dtBasicExample tbody').on( 'click', 'tr', function () {
    if ( $(this).hasClass('selected') ) {
      $("#viewBtn").attr("disabled",true);
    }
    else {
      $("#viewBtn").attr("disabled",false);
      selectedRowData = table.row( this ).data();

      $('#info_company').html(selectedRowData[0]);
      $('#info_city').html(selectedRowData[1]);
      $('#info_region').html(selectedRowData[2]);
      $('#info_phone').html(selectedRowData[3]);
      $('#info_contact').html(selectedRowData[4]);
      $('#info_website').html(selectedRowData[5]);
      $('#info_googlerank').html(selectedRowData[6]);
      $('#info_query').html(selectedRowData[7]);
      $('#info_email').html(selectedRowData[8]);
    }
  } );


  function updateThumbnail(filename) {
    console.log(filename, 'from websocketserver');
    table.rows( function ( idx, data, node ) {
      if(data[9] === filename){
        table.row(idx).data(data).invalidate();
      }
      return false;
    });
  }
  var host = window.document.location.host.replace(/:.*/, '');
  var ws = new WebSocket('wss://' + host + '/');
  ws.onmessage = function (event) {
    updateThumbnail(event.data);
  };
});



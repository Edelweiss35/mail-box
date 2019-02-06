$(document).ready(function () {
  
  // Hide Spinner
  $('#spinner').removeClass('hide-opacity');

  // Setup - add a text input to each header cell
  $('#dtBasicExample thead tr:eq(0) th').each( function (i) {
    
    if(i == 0){
      // check all
      $(this).html('<div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input" id="checkAll"><label class="custom-control-label" for="checkAll" ></label></div>');
    }
    else
      $(this).html('<div class="input-group md-form form-sm form-1 pl-0"><div class="input-group-prepend"><span class="input-group-text white lighten-3" ><i class="fas fa-search text-purple" aria-hidden="true"></i></span></div><input class="form-control my-0 py-1" type="text" aria-label="Search"></div>');

    $( 'input', this ).on( 'keyup change', function () {
      if ( i > 0 && table.column(i).search() !== this.value ) {
        table
          .column(i)
          .search( this.value )
          .draw();
      }
    });
  });

  // Init Datatable
  var table = $('#dtBasicExample').DataTable({
    "lengthMenu": [ 25, 50, 100 ],
    select: true,
    'createdRow': function(row, data, dataIndex){
      $('td:eq(0)', row).css('min-width', '70px');
      $('td:eq(2)', row).css('min-width', '100px');
      $('td:eq(3)', row).css('min-width', '100px');
      $('td:eq(8)', row).css('min-width', '100px');
    },
    "columnDefs": [ {
      "targets": 6,
      "render": function ( data, type, full, meta ) {
        return '<a target="_blank" rel="noopener noreferrer" href="'+data+'">'+data+'</a>';
      }
    },{
      "targets": 10,
      "render": function ( data, type, full, meta ) {
        return '<a target="_blank" href="img/SS/'+data+'"><img src="img/SS/'+data+'" alt="'+data+'" style="width:150px"></a>';
      }
    },{
      "targets": 0,
      'searchable': false,
      'orderable': false,
      "render": function ( data, type, full, meta ) {
        return '<div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input" id="'+data+'"><label class="custom-control-label" for="'+data+'" ></label></div>';
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

        row.push(ele._id);
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
    if ( !$(this).hasClass('selected') ) {
      selectedRowData = table.row( this ).data();

      $('#info_company').html(selectedRowData[1]);
      $('#info_city').html(selectedRowData[2]);
      $('#info_region').html(selectedRowData[3]);
      $('#info_phone').html(selectedRowData[4]);
      $('#info_contact').html(selectedRowData[5]);
      $('#info_website').html(selectedRowData[6]);
      $('#info_googlerank').html(selectedRowData[7]);
      $('#info_query').html(selectedRowData[8]);
      $('#info_email').html(selectedRowData[9]);
      $('#rowViewfullHeightModalRight').modal();
    }
  } );
  // Checkbox / Select All link
  $('div#dtBasicExample_wrapper div.row:nth-child(1) div.col-md-6').removeClass('col-md-6').addClass('col-md-4');
  $('div#dtBasicExample_wrapper div.row:nth-child(1)').prepend('<div class="col-sm-12 col-md-4" style="padding-top:10px"><div id="linkContainer"><div><span id="sel_cnt">0 records selected</span></div><div><span id="sel_all">Select all records</span></div></div></div>');
  $('span#sel_all').on('click', function(){
    // Get all rows with search applied
    var rows = table.rows({ 'search': 'applied' }).nodes();
    $('span#sel_cnt').text(rows.length + ' records selected');
    // Check/uncheck checkboxes for all rows in the table
    $('input[type="checkbox"]', rows).prop('checked', true);
    $('input#checkAll').prop('checked', true);
  });

  $('input#checkAll').on('change', function(){
    var checked = $(this).prop('checked');
    var visible_records = $('input[type=checkbox]');
    if(checked){
      $('span#sel_cnt').text(visible_records.length - 1 + ' records selected');
    }
    else{
      $('span#sel_cnt').text('0 records selected');
      var rows = table.rows().nodes();
      $('input[type="checkbox"]', rows).prop('checked', false);
    }
    $('input[type=checkbox]').prop('checked', checked);
  });

  // Save button
  $('div#dtBasicExample_wrapper div.row:nth-child(3) div.col-sm-12').removeClass('col-md-5').removeClass('col-md-7').addClass('col-md-4');
  $('div#dtBasicExample_wrapper div.row:nth-child(3)').prepend('<div class="col-sm-12 col-md-4 text-left"><button type="button" class="btn btn-primary" id="saveBtn">Save</button></div>');

  $('button#saveBtn').on('click', function(){
    var len = table.rows().count();
    var idAry = [];
    for( var i = 0; i < len; i++){
      var row = table.rows(i).nodes();
      var checked = $('input[type="checkbox"]', row).prop('checked');
      if(checked){
        var data = table.row(i).data();
        var _id = data[0];
        idAry.push(_id);
      }
    }
    $.post('/saveStatus', {idAry}, function(){});
  });
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



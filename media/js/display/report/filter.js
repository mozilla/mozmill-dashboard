$(document).ready(function() {
	$('#filter div span').click(function(){
		$(this)
		  .parent('div')
		  .children('span')
		  .attr('class','');

		$(this)
		  .attr('class','selected');
	});
    $('#filter a.submitter').click(function(){
    	$(this).attr('href',submitter());
	});
});


var submitter = function(){
	var data={},
		key,
		value;

	$('#filter span.selected').each(function(){
		key = $(this)
		  .parent('div')
		  .attr('id');

		value = $(this).text();
		data[key]=value;
	});
	data['from_date']=$('#start-date').val();
	data['to_date']=$('#end-date').val();
	return serialize(data);
};

var serialize = function(obj) {
  var str = [];
  for(var p in obj)
     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
  return '?'+str.join("&");
}



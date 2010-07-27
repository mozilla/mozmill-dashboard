function(data) {
  //$.log(data)
  return {
    reports : data.rows.map(function(r) {
      var p = r.value;
      return p;
    })
  }
};

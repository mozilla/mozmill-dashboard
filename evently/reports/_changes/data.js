function(data) {
  //$.log(data)
  return {
    reports : data.rows.map(function(r) {
      var p = r.value;
      p['id'] = r.key;
      return p;
    })
  }
};

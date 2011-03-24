function max(array) {
  return Math.max.apply(Math, array);
};

function min(array) {
  return Math.min.apply(Math, array);
};

function average(array) {
  var length = array.length;
  for (var i = 0, sum = 0; i < length;
    sum += Number(array[i++]));
  return sum / length;
}

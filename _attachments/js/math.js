Array.prototype.max = function max() {
  return Math.max.apply(Math, this);
};

Array.prototype.min = function min() {
  return Math.min.apply(Math, this);
};

Array.prototype.average = function average() {
  var length = this.length;
  for (var i = 0, sum = 0; i < length;
    sum+=Number(this[i++]));
  return sum/length;
}

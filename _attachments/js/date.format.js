function ISODateString(aDate) {
  function pad(aNumber) {
    return aNumber < 10 ? '0' + aNumber : aNumber;
  }

  return aDate.getUTCFullYear() + '-' +
         pad(aDate.getUTCMonth() + 1) + '-' +
         pad(aDate.getUTCDate());
}

// For convenience...
Date.prototype.format = function () {
  return ISODateString(this);
};


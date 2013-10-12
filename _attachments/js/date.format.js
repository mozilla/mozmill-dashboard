/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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


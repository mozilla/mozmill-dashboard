var FIREFOX_VERSIONS = ["25.0", "24.0", "23.0", "22.0", "17.0"];
var TESTS_REPOSITORY = "http://hg.mozilla.org/qa/mozmill-tests";

var DASHBOARD_SERVERS = [
  {urlVal: "mozmill-addons.blargon7.com", titleId: "Add-ons"},
  {urlVal: "mozmill-ci.blargon7.com", titleId: "CI"},
  {urlVal: "mozmill-crowd.blargon7.com", titleId: "Crowd"},
  {urlVal: "mozmill-ondemand.blargon7.com", titleId: "On Demand"},
  {urlVal: "mozmill-sandbox.blargon7.com", titleId: "Sandbox"},
  {urlVal: "mozmill-staging.blargon7.com", titleId: "Staging"},
];

var BYTE_TO_MEGABYTE = 1/1048576;
var MAX_CHART_CHECKPOINTS = 450;

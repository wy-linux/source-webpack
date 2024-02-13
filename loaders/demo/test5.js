module.exports = function (content) {
  console.log("normal loader 5");
  return content;
};

module.exports.pitch = function () {
  console.log("pitch loader 5");
  return "pitchloader5";
};

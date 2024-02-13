module.exports = function (content) {
  console.log('normal loader 6');
  return content;
};

module.exports.pitch = function () {
  console.log("pitch loader 6");
};

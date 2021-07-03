const FundraiserFactory = artifacts.require("FundraiserFactory");

module.exports = function(_deployer) {
  // Use deployer to state migration tasks.
  _deployer.deploy(FundraiserFactory);
};

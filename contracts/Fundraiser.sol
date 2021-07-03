// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../node_modules/@openzeppelin/contracts/access/Ownable.sol';
import '../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol';

contract Fundraiser is Ownable {

    using SafeMath for uint256;
    
    struct Donation {
        uint256 value;
        uint256 date;
        // uint256 conversionFactor;
    }
    mapping (address => Donation[]) private _donations;

    string public name;
    string public url;
    string public imageURL;
    string public description;

    uint256 public totalDonations;
    uint256 public donationsCount;

    address payable public beneficiary;
    address private _owner;

    event DonationReceived(address indexed donor, uint256 value);
    event Withdraw(uint256 amount);

    constructor (
        string memory _name,
        string memory _url,
        string memory _imageURL,
        string memory _description,
        address payable _beneficiary,
        address _custodian
    ) {
        name = _name;
        url = _url;
        imageURL = _imageURL;
        description = _description;
        beneficiary = _beneficiary;
        transferOwnership(_custodian);
        totalDonations = 0;
        donationsCount = 0;
    }

    function setBeneficiary(address payable _beneficiary) public onlyOwner {
        beneficiary = _beneficiary;
    }

    function myDonationsCount() public view returns (uint256) {
        return _donations[msg.sender].length;
    }

    function donate() public payable {

        totalDonations = totalDonations.add(msg.value);
        donationsCount++;

        Donation memory donation = Donation({
            value: msg.value,
            date: block.timestamp
        });

        _donations[msg.sender].push(donation);

        emit DonationReceived(msg.sender, msg.value);
    }

    function myDonations() public view returns (
        uint256[] memory values,
        uint256[] memory dates
    ) {
        uint256 size = myDonationsCount();
        values = new uint256[] (size);
        dates = new uint256[] (size);

        for (uint256 index = 0; index < size; index++) {
            values[index] = _donations[msg.sender][index].value;
            dates[index] = _donations[msg.sender][index].date;
        }

        return (values, dates);
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        beneficiary.transfer(balance);
        emit Withdraw(balance);
    }

    fallback () external payable {
        totalDonations = totalDonations.add(msg.value);
        donationsCount ++;
    }

}
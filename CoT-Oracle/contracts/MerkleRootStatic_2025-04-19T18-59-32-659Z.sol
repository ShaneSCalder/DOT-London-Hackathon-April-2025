// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract MerkleRootStatic {
    bytes32 public predefinedMerkleRoot;
    mapping(uint256 => bytes32) private _roots;

    event MerkleRootAdded(uint256 indexed itemId, bytes32 indexed root);

    constructor() {
        predefinedMerkleRoot = keccak256(abi.encodePacked("a0588b658a44a90a499ed440ff7f629f58862b22efb9618b0e4a25e647766782"));
    }

    function addMerkleRoot(uint256 itemId, bytes32 root) external {
        require(_roots[itemId] == bytes32(0), "Already set");
        _roots[itemId] = root;
        emit MerkleRootAdded(itemId, root);
    }

    function getMerkleRoot(uint256 itemId) external view returns (bytes32) {
        return _roots[itemId];
    }
}
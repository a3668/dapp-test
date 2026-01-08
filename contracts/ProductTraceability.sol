// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ProductTraceability is AccessControl {
    bytes32 public constant VIP_ROLE = keccak256("VIP_ROLE");

    struct Product {
        uint256 productId;
        string name;
        string origin;
        address producer;
        uint256 timestamp;
        bool exists;
    }

    mapping(uint256 => Product) private products;

    event ProductRegistered(
        uint256 indexed productId,
        address indexed producer,
        uint256 timestamp,
        string name,
        string origin
    );

    event VIPAdded(address indexed account);
    event VIPRemoved(address indexed account);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not admin");
        _;
    }

    modifier onlyVIPOrAdmin() {
        bool adminOk = hasRole(DEFAULT_ADMIN_ROLE, msg.sender);

        bool isVip = hasRole(VIP_ROLE, msg.sender);
        require(adminOk || isVip, "Not VIP or admin");
        _;
    }

    function addVIP(address account) external onlyAdmin {
        require(account != address(0), "Zero address");
        _grantRole(VIP_ROLE, account);
        emit VIPAdded(account);
    }

    function removeVIP(address account) external onlyAdmin {
        require(account != address(0), "Zero address");
        _revokeRole(VIP_ROLE, account);
        emit VIPRemoved(account);
    }

    function isVIP(address account) external view returns (bool) {
        return hasRole(VIP_ROLE, account);
    }

    function isAdmin(address account) external view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }

    function registerProduct(
        uint256 productId,
        string calldata name,
        string calldata origin
    ) external onlyVIPOrAdmin {
        require(productId != 0, "Invalid productId");
        require(!products[productId].exists, "Product already exists");
        require(bytes(name).length > 0, "Empty name");
        require(bytes(origin).length > 0, "Empty origin");

        products[productId] = Product({
            productId: productId,
            name: name,
            origin: origin,
            producer: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit ProductRegistered(productId, msg.sender, block.timestamp, name, origin);
    }

    function exists(uint256 productId) external view returns (bool) {
        return products[productId].exists;
    }

    function getProduct(uint256 productId)
        external
        view
        returns (
            uint256 id,
            string memory name,
            string memory origin,
            address producer,
            uint256 timestamp
        )
    {
        Product storage p = products[productId];
        require(p.exists, "Product not found");
        return (p.productId, p.name, p.origin, p.producer, p.timestamp);
    }
}

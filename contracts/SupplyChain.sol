// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

contract SupplyChain {
  address public owner;

  mapping(address => bool) public isManufacturer;
  mapping(address => bool) public isDistributor;
  mapping(address => bool) public isPharmacy;
  mapping(address => bool) public isPatient;
  mapping(uint256 => Drug) public drugs;
  mapping(uint256 => Lot) public lots;
  mapping(uint256 => address[]) public lotToPatient;
  mapping(uint256 => ingredientToComposition[])
    public drugIngredientCompositions;

  uint256[] public drugIds;
  uint256[] public lotIds;

  enum DrugState {
    Formulated,
    Approved
  }

  enum LotState {
    Manufactured,
    Shipped,
    Received
  }

  struct ingredientToComposition {
    string ingredient;
    uint256 composition;
  }

  struct Drug {
    uint256 id;
    string name;
    DrugState state;
  }

  struct Lot {
    uint256 id;
    uint256 drugId;
    string name;
    uint256 quantity;
    address manufacturer;
    address distributor;
    address pharmacy;
    LotState state;
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Only contract owner can perform this action");
    _;
  }

  modifier onlyManufacturer() {
    require(
      isManufacturer[msg.sender],
      "Only approved manufacturers can perform this action"
    );
    _;
  }

  modifier onlyDistributor() {
    require(
      isDistributor[msg.sender],
      "Only approved distributors can perform this action"
    );
    _;
  }

  modifier onlyPharmacy() {
    require(
      isPharmacy[msg.sender],
      "Only approved pharmacies can perform this action"
    );
    _;
  }

  modifier onlyPatient() {
    require(
      isPatient[msg.sender],
      "Only approved patients can perform this action"
    );
    _;
  }

  event DrugFormulated(uint256 drugId);
  event DrugApproved(uint256 drugId);
  event LotManufactured(uint256 LotId);
  event LotShipped(uint256 LotId);
  event LotReceived(uint256 LotId);
  event MedicineBought(uint256 LotId);

  constructor() {
    owner = msg.sender;
  }

  function addManufacturer(address _manufacturer) public onlyOwner {
    isManufacturer[_manufacturer] = true;
  }

  function addDistributor(address _distributor) public onlyOwner {
    isDistributor[_distributor] = true;
  }

  function addPharmacy(address _pharmacy) public onlyOwner {
    isPharmacy[_pharmacy] = true;
  }

  function addPatient(address _patient) public onlyOwner {
    isPatient[_patient] = true;
  }

  function formulateDrug(
    string memory _name,
    ingredientToComposition[] memory _ingredients
  ) public onlyManufacturer returns (uint256) {
    uint256 id = generateUniqueID();
    drugIds.push(id);
    for (uint i = 0; i < _ingredients.length; i++) {
      drugIngredientCompositions[id].push(_ingredients[i]);
    }
    drugs[id] = Drug({ id: id, name: _name, state: DrugState.Formulated });
    emit DrugFormulated(id);
    return id;
  }

  function approveDrug(uint256 _drugId) public onlyOwner {
    drugs[_drugId].state = DrugState.Approved;
    emit DrugApproved(_drugId);
  }

  function manufacturLot(
    string memory _name,
    uint256 _quantity,
    uint256 _drugId
  ) public onlyManufacturer returns (uint256) {
    require(
      drugs[_drugId].state == DrugState.Approved,
      "Drug must be approved before manufacturing"
    );
    require(_quantity > 0, "Quantity should be greater than zero");
    uint256 id = generateUniqueID();
    lotIds.push(id);
    lots[id] = Lot({
      id: id,
      drugId: _drugId,
      name: _name,
      quantity: _quantity,
      manufacturer: msg.sender,
      distributor: address(0),
      pharmacy: address(0),
      state: LotState.Manufactured
    });
    emit LotManufactured(id);
    return id;
  }

  function shipLot(uint256 _lotId) public onlyDistributor {
    require(
      lots[_lotId].state == LotState.Manufactured,
      "Drug has not been created or already been shipped"
    );
    lots[_lotId].distributor = msg.sender;
    lots[_lotId].state = LotState.Shipped;

    emit LotShipped(_lotId);
  }

  function receiveDrug(uint256 _lotId) public onlyPharmacy {
    require(
      lots[_lotId].state == LotState.Shipped,
      "Drug has not been shipped yet"
    );
    lots[_lotId].pharmacy = msg.sender;
    lots[_lotId].state = LotState.Received;
    emit LotReceived(_lotId);
  }

  function buyMedicine(uint256 _lotId) public onlyPatient {
    require(
      lots[_lotId].state == LotState.Received,
      "Drug is not available for purchase"
    );
    require(lots[_lotId].quantity > 0, "Drug is out of stock");
    lots[_lotId].quantity--;
    lotToPatient[_lotId].push(msg.sender);
    emit MedicineBought(_lotId);
  }

  //getter functions

  function getDrugById(uint256 _drugId) public view returns (Drug memory) {
    return drugs[_drugId];
  }

  function getLotById(uint256 _lotId) public view returns (Lot memory) {
    return lots[_lotId];
  }

  function getDrugIds() public view returns (uint256[] memory) {
    return drugIds;
  }

  function getLotIds() public view returns (uint256[] memory) {
    return lotIds;
  }

  // utility functions

  function generateUniqueID() private view returns (uint256) {
    return
      uint256(
        keccak256(
          abi.encodePacked(
            block.timestamp,
            msg.sender,
            block.difficulty,
            blockhash(block.number - 1)
          )
        )
      );
  }
}

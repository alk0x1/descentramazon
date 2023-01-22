const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ID = 1;
const NAME = "Shoes";
const CATEGORY = "Clothing";
const IMAGE = "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg";
const COST = tokens(1);
const RATING = 4;
const STOCK = 5;


describe("Descentramazon", () => {
  let descentramazon, deployer, buyer;

  beforeEach(async () => {
    // Setup Accounts
    [deployer, buyer] = await ethers.getSigners();

    // Deploy Contract
    const Descentramazon = await ethers.getContractFactory("Descentramazon");
    descentramazon = await Descentramazon.deploy();
  });

  describe("Deployment", () => {
    it('sets the owner', async () => {
      expect(await descentramazon.owner()).to.equal(deployer.address);
    });
  });

  describe("Listing", () => {
    let transaction;

    beforeEach(async () => { 
      transaction = await descentramazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);
      await transaction.wait();
    });

    it("returns item attributes", async () => {
      const item = await descentramazon.items(ID);

      expect(item.id).to.equal(ID);
      expect(item.name).to.equal(NAME);
      expect(item.category).to.equal(CATEGORY);
      expect(item.image).to.equal(IMAGE);
      expect(item.cost).to.equal(COST);
      expect(item.rating).to.equal(RATING);
      expect(item.stock).to.equal(STOCK);
    });

    it("Emits List event", () => {
      expect(transaction).to.emit(descentramazon, "List")
    });
  });

  describe("Buying", () => {
    let transaction;

    beforeEach(async () => { 
      // List an item      
      transaction = await descentramazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);
      await transaction.wait();

      // Buy an item
      transaction = await descentramazon.connect(buyer).buy(ID, { value: COST });
    });

    it("updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(descentramazon.address);
      expect(result).to.equal(COST);
    });
    
    it("updates buyer's order count", async () => {
      const result = await descentramazon.orderCount(buyer.address);
      expect(result).to.equal(1);
    });

    it("adds the order", async () => {
      const result = await ethers.provider.getBalance(descentramazon.address);
      expect(result).to.equal(COST);
    });

    it("emits Buy event", () => {
      expect(transaction).to.emit(descentramazon, "Buy");
    });
  });

  describe("Withdrawing", () => {
    let balanceBefore

    beforeEach(async () => {
      // List a item
      let transaction = await descentramazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);
      await transaction.wait();

      // Buy a item
      transaction = await descentramazon.connect(buyer).buy(ID, { value: COST });
      await transaction.wait();

      // Get Deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address);

      // Withdraw
      transaction = await descentramazon.connect(deployer).withdraw();
      await transaction.wait();
    });

    it('updates the owner balance', async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it('updates the contract balance', async () => {
      const result = await ethers.provider.getBalance(descentramazon.address);
      expect(result).to.equal(0);
    });
  });
});

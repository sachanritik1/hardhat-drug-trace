const { network, ethers, deployments } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Supply-chain unit testing...", () => {
      let deployer,
        supplyChain,
        supplyChainContract,
        distributor,
        pharmacy,
        patient,
        manufacturer,
        notOwner;
      beforeEach(async () => {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        manufacturer = accounts[1];
        distributor = accounts[2];
        pharmacy = accounts[3];
        patient = accounts[4];
        notOwner = accounts[5];
        await deployments.fixture(["all"]);
        supplyChainContract = await ethers.getContract("SupplyChain");
        supplyChain = supplyChainContract.connect(deployer);

        describe("constructor", () => {
          it("should set the owner to the deployer", async () => {
            assert.equal(await supplyChain.owner(), deployer.address);
          });
        });

        describe("addManufacturer", () => {
          it("should add a manufacturer", async () => {
            await supplyChain.addManufacturer(manufacturer.address);
            assert.equal(
              await supplyChain.IsManufacturer(manufacturer.address),
              true
            );
          });
          it("should not add a manufacturer if not called by the owner", async () => {
            await expect(
              supplyChain.connect(notOwner).addManufacturer(distributor.address)
            ).to.be.revertedWith("Only contract owner can perform this action");
          });
        });
        describe("addDistributor", () => {
          it("should add a Distributor", async () => {
            await supplyChain
              .connect(deployer)
              .addDistributor(distributor.address);
            assert.equal(
              await supplyChain.IsDistributor(distributor.address),
              true
            );
          });
          it("should not add a Distributor if not called by the owner", async () => {
            await expect(
              supplyChain.connect(notOwner).addDistributor(distributor.address)
            ).to.be.revertedWith("Only contract owner can perform this action");
          });
        });

        describe("addPharmacy", () => {
          it("should add a Pharmacy", async () => {
            await supplyChain.connect(deployer).addPharmacy(pharmacy.address);
            assert.equal(await supplyChain.IsPharmacy(pharmacy.address), true);
          });
          it("should not add a Pharmacy if not called by the owner", async () => {
            await expect(
              supplyChain.connect(notOwner).addPharmacy(pharmacy.address)
            ).to.be.revertedWith("Only contract owner can perform this action");
          });
        });

        describe("addPatient", () => {
          it("should add a Patient", async () => {
            await supplyChain.connect(deployer).addPatient(patient.address);
            assert.equal(await supplyChain.IsPatient(patient.address), true);
          });
          it("should not add a Patient if not called by the owner", async () => {
            await expect(
              supplyChain.connect(notOwner).addPatient(patient.address)
            ).to.be.revertedWith("Only contract owner can perform this action");
          });
        });

        // describe("formulateDrug", () => {
        //   beforeEach(async () => {
        //     await supplyChain
        //       .connect(deployer)
        //       .addManufacturer(manufacturer.address);
        //   });
        //   it("should formulate a Drug and emit the DrugFormulated event", async () => {
        //     const tx = await supplyChainContract
        //       .connect(manufacturer)
        //       .formulateDrug("drug1", [
        //         { ingredient: "ingredient1", composition: 40 },
        //         { ingredient: "ingredient2", composition: 60 },
        //       ]);

        //     await tx.wait();
        //     const filter = supplyChainContract.filters.DrugFormulated();
        //     const events = await supplyChainContract.queryFilter(filter);
        //     expect(events.length).to.equal(1);

        //     const eventData = events[0];
        //     console.log(eventData.args.drugId);
        //   });
        // });
      });
    });

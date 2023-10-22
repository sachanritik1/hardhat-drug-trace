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

        // supplyChain.events
        //   .DrugFormulated()
        //   .on("data", (event) => {
        //     console.log("Event Data:", event.returnValues);
        //   })
        //   .on("error", (error) => {
        //     console.error("Error:", error);
        //   });
      });

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
        it("should not add a Distibutor if not called by the owner", async () => {
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

      describe("formulateDrug", () => {
        beforeEach(async () => {
          await supplyChain
            .connect(deployer)
            .addManufacturer(manufacturer.address);
        });
        it("should formulate a Drug", async () => {
          expect(
            await supplyChain.connect(manufacturer).formulateDrug("drug1", [
              { ingredient: "ingredient1", composition: 40 },
              { ingredient: "ingredient2", composition: 60 },
            ])
          )
            .to.emit(supplyChain, "DrugFormulated")
            .withArgs("drugId");
        });
        it("should not create a Drug if not called by a manufacturer", async () => {
          await expect(
            supplyChain.connect(notOwner).createDrug("drug2", 100)
          ).to.be.revertedWith(
            "Only approved manufacturers can perform this action"
          );
        });
        it("should not create a Drug if quantity is less than 1", async () => {
          await expect(
            supplyChain.connect(manufacturer).createDrug("drug3", 0)
          ).to.be.revertedWith("Quantity should be greater than zero");
        });
      });

      describe("shipDrug", () => {
        beforeEach(async () => {
          await supplyChain
            .connect(deployer)
            .addManufacturer(manufacturer.address);
          await supplyChain.addDistributor(distributor.address);
        });
        it("should ship a Drug", async () => {
          await supplyChain.connect(manufacturer).createDrug("drug1", 100);
          await supplyChain.connect(distributor).shipDrug(0);
          assert.equal(await supplyChain.getDrugState(0), 1);
          assert.equal(
            await supplyChain.getDrugDistributor(0),
            distributor.address
          );
        });
        it("should not ship a Drug if not called by a distributor", async () => {
          await supplyChain.connect(manufacturer).createDrug("drug1", 100);
          await expect(
            supplyChain.connect(notOwner).shipDrug(0)
          ).to.be.revertedWith(
            "Only approved distributors can perform this action"
          );
        });
        it("should not ship a Drug if the drug is not in the created state", async () => {
          await supplyChain.connect(distributor).shipDrug(0);
          await expect(
            supplyChain.connect(distributor).shipDrug(0)
          ).to.be.revertedWith(
            "Drug has not been created or already been shipped"
          );
        });
      });

      describe("receiveDrug", () => {
        beforeEach(async () => {
          await supplyChain.addManufacturer(manufacturer.address);
          await supplyChain.addDistributor(distributor.address);
          await supplyChain.addPharmacy(pharmacy.address);
        });
        it("should receive a Drug", async () => {
          await supplyChain.connect(manufacturer).createDrug("drug1", 100);
          await supplyChain.connect(distributor).shipDrug(0);
          expect(await supplyChain.connect(pharmacy).receiveDrug(0)).to.emit(
            supplyChain,
            "DrugReceived"
          );

          assert.equal(await supplyChain.getDrugState(0), 2);
          assert.equal(await supplyChain.getDrugPharmacy(0), pharmacy.address);
        });
        it("should not receive a Drug if not called by a pharmacy", async () => {
          await supplyChain.connect(manufacturer).createDrug("drug1", 100);
          await supplyChain.connect(distributor).shipDrug(0);
          await expect(
            supplyChain.connect(notOwner).receiveDrug(0)
          ).to.be.revertedWith(
            "Only approved pharmacies can perform this action"
          );
        });
        it("should not receive a Drug if the drug is not in the shipped state", async () => {
          await supplyChain.connect(manufacturer).createDrug("drug1", 100);
          await expect(
            supplyChain.connect(pharmacy).receiveDrug(0)
          ).to.be.revertedWith("Drug has not been shipped yet");
        });
      });

      describe("buyDrug", () => {
        beforeEach(async () => {
          await supplyChain.addManufacturer(manufacturer.address);
          await supplyChain.addDistributor(distributor.address);
          await supplyChain.addPharmacy(pharmacy.address);
          await supplyChain.addPatient(patient.address);
        });
        it("should buy a Drug", async () => {
          await supplyChain.connect(manufacturer).createDrug("drug1", 100);
          await supplyChain.connect(distributor).shipDrug(0);
          await supplyChain.connect(pharmacy).receiveDrug(0);
          expect(await supplyChain.connect(patient).buyDrug(0)).to.emit(
            supplyChain,
            "DrugBought"
          );
          assert.equal(
            (await supplyChain.getDrugToPatient(0))[0],
            patient.address
          );
          assert.equal(await supplyChain.getDrugQuantity(0), 99);
          assert.equal(await supplyChain.getDrugPatient(0), patient.address);
        });
        it("should not buy a Drug if not called by a patient", async () => {
          await supplyChain.connect(manufacturer).createDrug("drug1", 100);
          await supplyChain.connect(distributor).shipDrug(0);
          await supplyChain.connect(pharmacy).receiveDrug(0);
          await expect(
            supplyChain.connect(notOwner).buyDrug(0)
          ).to.be.revertedWith(
            "Only approved patients can perform this action"
          );
        });
        it("should not buy a Drug if the drug is not in the received state", async () => {
          await supplyChain.connect(manufacturer).createDrug("drug1", 100);
          await supplyChain.connect(distributor).shipDrug(0);
          await expect(
            supplyChain.connect(patient).buyDrug(0)
          ).to.be.revertedWith("Drug is not available for purchase");
        });
      });
    });

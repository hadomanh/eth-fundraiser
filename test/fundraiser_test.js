const FundraiserContract = artifacts.require('Fundraiser');

contract('Fundraiser', async (accounts) => {
    let fundraiser;
    const name = "Beneficiary Name";
    const url = "beneficiaryname.org";
    const imageURL = "https://placekitten.com/600/350";
    const description = "Beneficiary description";
    const beneficiary = accounts[1];
    const owner = accounts[0];
    const newBeneficiary = accounts[2];

    beforeEach(async () => {
        fundraiser = await FundraiserContract.new(name,
            url, imageURL, description, beneficiary, owner
        )
    });

    describe("initialization", () => {
        it("gets the beneficiary name", async () => {
            const actual = await fundraiser.name();
            assert.equal(actual, name, "names should match");
        });
        it("gets the beneficiary url", async () => {
            const actual = await fundraiser.url();
            assert.equal(actual, url, "url should match");
        });
        it("gets the beneficiary image url", async () => {
            const actual = await fundraiser.imageURL();
            assert.equal(actual, imageURL, "imageURL should match");
        });
        it("gets the beneficiary description", async () => {
            const actual = await fundraiser.description();
            assert.equal(actual, description, "description should match");
        });

        it("gets the beneficiary", async () => {
            const actual = await fundraiser.beneficiary();
            assert.equal(actual, beneficiary, "beneficiary addresses should match");
        });

        it("gets the owner", async () => {
            const actual = await fundraiser.owner();
            assert.equal(actual, owner, "bios should match");
        });
    });

    describe('setBeneficiary', () => {
        it("updated beneficiary when called by owner account", async () => {
            await fundraiser.setBeneficiary(newBeneficiary, {from: owner});
            const actualBeneficiary = await fundraiser.beneficiary();
            assert.equal(actualBeneficiary, newBeneficiary, "beneficiaries should match");
        });
            
        it("throws an error when called from a non-owner account", async () => {
            try {
                await fundraiser.setBeneficiary(newBeneficiary, {from: accounts[3]});
                assert.fail("withdraw was not restricted to owners")
            } catch(err) {
                const expectedError = "Ownable: caller is not the owner"
                const actualError = err.reason;
                assert.equal(actualError, expectedError, "should not be permitted")
            }
        })
    });

    describe("making donations", () => {
        const value = web3.utils.toWei('0.0289');
        const donor = accounts[2];
        it("increases myDonationsCount", async () => {
            const currentDonationCount
                = await fundraiser.myDonationsCount({
                    from: donor
                });

            await fundraiser.donate({
                from: donor,
                value: value
            });

            const newDonationCount
                = await fundraiser.myDonationsCount({
                    from: donor
                });

            assert.equal(newDonationCount - currentDonationCount, 1, "myDonationsCount should increment by 1");
        });

        it("increases totalDonations", async () => {
            const currentTotal = await fundraiser.totalDonations();

            await fundraiser.donate({
                from: donor,
                value: value
            });

            const newTotal = await fundraiser.totalDonations();

            assert.equal(newTotal - currentTotal, value, "myDonationsCount should increment by 1");
        });

        it("increases donationsCount", async () => {
            const currentCount = await fundraiser.donationsCount();

            await fundraiser.donate({
                from: donor,
                value: value
            });

            const newCount = await fundraiser.donationsCount();

            assert.equal(newCount - currentCount, 1, "myDonationsCount should increment by 1");
        });

        it("includes donation in myDonations", async () => {
            await fundraiser.donate({
                from: donor,
                value: value
            });

            const {values, dates} = await fundraiser.myDonations({from: donor});
            assert.equal(value, values[0], 'values should match');
            assert(dates[0], "date should be present");
        });

        it('emit DonationReceived event', async () => {
            const tx = await fundraiser.donate({
                from: donor,
                value: value
            });
            const expectedEvent = 'DonationReceived';
            const actualEvent = tx.logs[0].event;

            assert.equal(actualEvent, expectedEvent, "events should match");
        })

    });

    describe('withdrawing funds', () => {
        const donor = accounts[2];
        const value = web3.utils.toWei('0.1');
        beforeEach( async () => {
            await fundraiser.donate({from: donor, value});
        });

        describe("access controls", () => {
            it("throws an error when called from a non-owner account", async () => {
                try {
                    await fundraiser.withdraw({from: accounts[3]});
                    assert.fail("withdraw was not restricted to owners")
                } catch(err) {
                const expectedError = "Ownable: caller is not the owner"
                const actualError = err.reason;
                assert.equal(actualError, expectedError, "should not be permitted")
                }
            });

            it("permits the owner to call the function", async () => {
                try {
                    await fundraiser.withdraw({from: owner});
                    assert(true, "no errors were thrown");
                } catch(err) {
                    assert.fail("should not have thrown an error");
                }
            });

            it('transfers balance to beneficiary', async () => {
                const constractBalanceBefore = await web3.eth.getBalance(fundraiser.address);
                const beneficiaryBalanceBefore = await web3.eth.getBalance(beneficiary);

                await fundraiser.withdraw({from: owner});

                const constractBalanceAfter = await web3.eth.getBalance(fundraiser.address);
                const beneficiaryBalanceAfter = await web3.eth.getBalance(beneficiary);

                const beneficiaryBalanceDiff = beneficiaryBalanceAfter - beneficiaryBalanceBefore;

                assert.equal(constractBalanceAfter, 0, "contract should have a 0 balance");
                assert.equal(beneficiaryBalanceDiff, constractBalanceBefore, "beneficiary should receive all the funds");

            });

            it('emits Withdraw event', async () => {
                const tx = await fundraiser.withdraw({from: owner});
                const expectedEvent = 'Withdraw';
                const actualEvent = tx.logs[0].event;
                assert.equal(actualEvent, expectedEvent, 'events should match');
            });

        });

    })

    describe("fallback function", () => {
        const value = web3.utils.toWei('0.0289');
        it("increases the totalDonations amount", async () => {
            const currentTotalDonations = await fundraiser.totalDonations();
            await web3.eth.sendTransaction({to: fundraiser.address, from: accounts[9], value});
            const newTotalDonations = await fundraiser.totalDonations();
            const diff = newTotalDonations - currentTotalDonations;
            assert.equal( diff, value, "difference should match the donation value")
        });
        
        it("increases donationsCount", async () => {
            const currentDonationsCount = await fundraiser.donationsCount();
            await web3.eth.sendTransaction({to: fundraiser.address, from: accounts[9], value});
            const newDonationsCount = await fundraiser.donationsCount();
            assert.equal(1, newDonationsCount - currentDonationsCount, "donationsCount should increment by 1");
        });
    });

})
const ethers = require('ethers');
const solc = require('solc');
const ganache = require("ganache-core");

//Initialize a wallet with a random private key, give it 10 ether
//to start, and use ganache to spin up a local blockchain and pass
//it to a provider object
const randomWallet = ethers.Wallet.createRandom();
const ganacheProvider = ganache.provider({ accounts: [{
    balance: ethers.utils.parseEther("10").toString(),
    secretKey: randomWallet.privateKey,
}]});

//Hook up an ethersjs provider object to our ganache provider,
//and link our random wallet tot it
const provider = new ethers.providers.Web3Provider(ganacheProvider);
const wallet = randomWallet.connect(provider);

//Smart contract content, simple test case
const content = `
    pragma solidity ^0.8.6;
    contract Contract {
        uint public x;
        constructor(uint _x) {
            x = _x;
        }

        function changeX(uint _x) external {
            x = _x;
        }

        function doubleX() external view returns (uint){
            return x*2;
        }
    }
`;

//Get input object ready to pass to solc compiler
const input = {
    language: 'Solidity',
    sources: { 'contract.sol': { content } },
    settings: { outputSelection: { '*': { '*': ['*'] } } }
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
async function deploy() {
    //Grab ABI for our contract from the output, give it to ethers js
    const { Contract: { abi, evm: { bytecode }}} = output.contracts['contract.sol'];
    const factory = new ethers.ContractFactory(abi, bytecode.object, wallet);
    const contract = await factory.deploy(5);
    
    //Play with functions
    let x = await contract.x();
    console.log(x.toString()); // 5
    await contract.changeX(7);
    x = await contract.x();
    console.log(x.toString()); // 7
    const doubleX = await contract.doubleX();
    console.log(doubleX.toNumber()); // 14

}
deploy();
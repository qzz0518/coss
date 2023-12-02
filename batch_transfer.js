require('dotenv').config();
const { SigningStargateClient, GasPrice, coins } = require("@cosmjs/stargate");
const { DirectSecp256k1Wallet } = require('@cosmjs/proto-signing');
const { readFileSync } = require("fs");
const axios = require('axios');
const {base64FromBytes} = require("cosmjs-types/helpers");

async function transferToMain(walletInfo, mainAddress) {
    const rpcEndpoint = process.env.NODE_URL;
    const gasPrice = GasPrice.fromString("0.025uatom");
    const wallet = await DirectSecp256k1Wallet.fromKey(Buffer.from(walletInfo.privateKey, "hex"), "cosmos");
    const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet, { gasPrice: gasPrice });
    const fee = {
        amount: coins(750, "uatom"), // 修改为适当的费用
        gas: "100000",
    };

    const [account] = await wallet.getAccounts();
    try {
        const url = `https://coss.ink/api/holders?page=1&limit=100&address=${account.address}`;
        const response = await axios.get(url);
        const amount = response.data.data.holders[0].amount;
        console.log(`地址: ${account.address} 余额: ${parseFloat(amount)}`);
        if (amount > 0) {
            const memo = `data:,{"op":"transfer","amt":${amount},"tick":"coss","p":"crc-20"}`;
            const result = await client.sendTokens(account.address, mainAddress, coins(1, "uatom"), fee, base64FromBytes(Buffer.from(memo, 'utf8')));
            console.log(`Transfer from ${account.address} successful:  ${'https://www.mintscan.io/cosmos/tx/' + result.transactionHash}`);
        } else {
            console.log(`No balance to transfer from ${account.address}`);
        }
    } catch (error) {
        console.error(`Error during transfer from ${account.address}: `, error);
    }
}

async function main() {
    let walletData = [];
    const mainAddress = "YOUR_MAIN_ADDRESS_HERE";
    try {
        walletData = JSON.parse(readFileSync('cosmos_wallets.json', 'utf-8'));
    } catch (e) {
        console.log('未找到 cosmos_wallets.json');
    }

    for (const wallet of walletData) {
        await transferToMain(wallet, mainAddress);
    }
    console.log("所有操作完成");
}

main();

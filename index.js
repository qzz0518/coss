require('dotenv').config();
const { SigningStargateClient, GasPrice } = require("@cosmjs/stargate");
const { MsgSend } = require("cosmjs-types/cosmos/bank/v1beta1/tx");
const { base64FromBytes } = require("cosmjs-types/helpers");
const { DirectSecp256k1Wallet } = require("@cosmjs/proto-signing");

async function main(transactionCount) {
    const rpcEndpoint = process.env.NODE_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const wallet = await DirectSecp256k1Wallet.fromKey(Buffer.from(privateKey, "hex"), "cosmos");
    const [account] = await wallet.getAccounts();
    const walletAddress = account.address;

    const gasPrice = GasPrice.fromString("0.025uatom");
    const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet, { gasPrice: gasPrice });
    // 打印当前钱包的地址和余额
    const balance = await client.getBalance(walletAddress, "uatom");
    console.log(`地址: ${walletAddress} 余额: ${parseFloat(balance.amount) / 1000000}`);
    let memo = 'data:,{"op":"mint","amt":10000,"tick":"coss","p":"crc-20"}';
    memo = base64FromBytes(Buffer.from(memo, 'utf8'));

    for (let i = 0; i < transactionCount; i++) {
        const msg = {
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: MsgSend.fromPartial({
                fromAddress: walletAddress,
                toAddress: walletAddress,
                amount: [{ denom: "uatom", amount: "1" }],
            }),
        };

        // 发送交易
        const result = await client.signAndBroadcast(walletAddress, [msg], 'auto', memo);
        console.log(`${i+1}: Transaction Hash: ${'https://www.mintscan.io/cosmos/tx/' + result.transactionHash}`);
    }
}

const transactionCount = parseInt(process.argv[2]) || 100;
main(transactionCount).catch(console.error);

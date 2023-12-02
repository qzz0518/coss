const axios = require('axios');
const fs = require('fs');

async function getHolderAmount(address) {
    try {
        const url = `https://coss.ink/api/holders?page=1&limit=100&address=${address}`;
        const response = await axios.get(url);
        const data = response.data.data;
        if (data.holders && data.holders.length > 0) {
            return data.holders[0].amount;
        }
        return 0;
    } catch (error) {
        console.error(`Error fetching data for address ${address}:`, error);
        return 0;
    }
}

async function getTotalAmount() {
    const wallets = JSON.parse(fs.readFileSync('cosmos_wallets.json', 'utf8'));
    let totalAmount = 0;
    for (const wallet of wallets) {
        const amount = await getHolderAmount(wallet.address);
        console.log(`Address: ${wallet.address}, Amount: ${amount}`);
        totalAmount += amount;
    }
    console.log(`Total Amount: ${totalAmount}`);
}

getTotalAmount();

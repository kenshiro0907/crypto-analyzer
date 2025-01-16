const axios = require("axios");

const walletAdress = process.env.WALLET_ADDRESS;

exports.getDataAddress = async (req, res) => {
  const authHeader = req.headers["authorization"]; // Récupère l'en-tête Authorization
  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Supprime "Bearer" et conserve uniquement le token
    req.token = token; // Stocke le token pour utilisation ultérieure
    //console.log(token);
  }

  const { address } = req.params;
  const { page = 1, offset = 10 } = req.query;
  const apiKey = process.env.ETHERSCAN_API_KEY;

  const etherscanUrl =
    process.env.ETHERSCAN_API_URL +
    `?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc&apikey=${apiKey}`;

  try {
    const response = await axios.get(etherscanUrl);

    let tabs_timestamp_and_ethQuantity = [];

    if (response.data.status === "1") {
      // Transactions récupérées avec succès

      tabs_timestamp_and_ethQuantity = response.data.result.map((t) => {
        const valueInEth = t.value / 1e18;
        const gasCostInEth = (t.gas * t.gasPrice) / 1e18;

        return {
          timestamp: t.timeStamp,
          ethQuantity:
            walletAdress === t.to ? valueInEth - gasCostInEth : valueInEth,
        };
      });
    }

    const ethPricePromises = tabs_timestamp_and_ethQuantity.map(async (t) => {
      const ethPriceUrl =
        process.env.CRYPTOCOMPARE_API_URL +
        `?fsym=ETH&tsyms=EUR&ts=${t.timestamp}&api_key=${process.env.CRYPTOCOMPARE_API_KEY}`;
      const ethPriceResponse = await axios.get(ethPriceUrl);
      const date = new Date(t.timestamp * 1000).toLocaleDateString("fr-FR");
      return {
        date: date,
        price: Number(
          (ethPriceResponse.data.ETH.EUR * t.ethQuantity).toFixed(2)
        ),
      };
    });

    const result = await Promise.all(ethPricePromises);

    res.json({
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue",
      error: error.message,
    });
  }
};

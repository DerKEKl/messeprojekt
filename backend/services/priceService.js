const axios = require("axios");
const https = require("https");

async function calcEnergyCosts(parts, date) {
  const priceByDay = await getEnergyPrice(date);

  const average = Math.round(priceByDay.reduce((acc, cur) => acc + cur.marketprice, 0) / priceByDay.length * 100) / 100;

  return parts * 0.2 * average;
}

async function getEnergyPrice(date) {

  let url = `https://api.awattar.at/v1/marketdata`;
  if (date) {
    const timestamp = new Date(date).getTime();
    url += `?start=${timestamp}`;
  }

  const agent = new https.Agent({ rejectUnauthorized: false });

  try {
    const response = await axios.get(url, { httpsAgent: agent });
    return response.data.data;
  } catch (error) {
    console.error("Fehler beim Abrufen der Strompreise:", error);
    return null;
  }
}

async function getProfitTime(partsCount) {
  const prices = await getEnergyPrice();
  const partsPerHour = 5;
  const hoursNeeded = Math.ceil(partsCount / partsPerHour);

  let bestStartIndex = 0;
  let lowestTotalPrice = Infinity;

  for (let i = 0; i <= prices.length - hoursNeeded; i++) {
    const window = prices.slice(i, i + hoursNeeded);
    const totalPrice = window.reduce((sum, entry) => sum + entry.marketprice, 0);

    if (totalPrice < lowestTotalPrice) {
      lowestTotalPrice = totalPrice;
      bestStartIndex = i;
    }
  }

  const bestWindow = prices.slice(bestStartIndex, bestStartIndex + hoursNeeded);

  return {
    startTimestamp: bestWindow[0].start_timestamp,
    endTimestamp: bestWindow[bestWindow.length - 1].start_timestamp,
    totalPrice: lowestTotalPrice,
    partsCount: partsCount,
    hoursNeeded: hoursNeeded
  };
}

module.exports = { calcEnergyCosts, getProfitTime };
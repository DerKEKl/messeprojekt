const axios = require("axios");

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

  try {
    const response = await axios.get(url);
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

  const availableHours = prices.length;
  const cycles = Math.ceil(hoursNeeded / availableHours);
  
  let extendedPrices = [];
  for (let cycle = 0; cycle < cycles; cycle++) {
    extendedPrices = extendedPrices.concat(prices);
  }

  const actualHoursToUse = Math.min(hoursNeeded, extendedPrices.length);
  
  const sortedPrices = [...extendedPrices]
    .sort((a, b) => a.marketprice - b.marketprice)
    .slice(0, actualHoursToUse);

  const selectedHours = sortedPrices.sort((a, b) => 
    new Date(a.start_timestamp).getTime() - new Date(b.start_timestamp).getTime()
  );

  const totalPrice = selectedHours.reduce((sum, entry) => sum + entry.marketprice, 0);

  return {
    startTimestamp: selectedHours[0].start_timestamp,
    endTimestamp: selectedHours[selectedHours.length - 1].start_timestamp,
    totalPrice: totalPrice,
    partsCount: partsCount,
    hoursNeeded: hoursNeeded
  };
}

module.exports = { calcEnergyCosts, getProfitTime };

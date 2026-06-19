const solUsdtTickerUrl = 'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT';

type BinanceTickerResponse = {
  price?: string;
};

export async function fetchSolUsdPrice() {
  try {
    const response = await fetch(solUsdtTickerUrl, {
      headers: {
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as BinanceTickerResponse;
    const price = Number(data.price);

    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

export const fetchBnbUsdPrice = fetchSolUsdPrice;

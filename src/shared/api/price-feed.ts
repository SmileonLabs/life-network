type BinanceTickerResponse = {
  price?: string;
  symbol?: string;
};

const bnbUsdtTickerUrl = 'https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT';
const priceRequestTimeoutMs = 5000;

export async function fetchBnbUsdPrice() {
  const controller = typeof AbortController === 'undefined' ? null : new AbortController();
  const timeout = controller
    ? setTimeout(() => {
        controller.abort();
      }, priceRequestTimeoutMs)
    : null;

  try {
    const response = await fetch(bnbUsdtTickerUrl, {
      signal: controller?.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as BinanceTickerResponse;
    const price = Number(data.price);

    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

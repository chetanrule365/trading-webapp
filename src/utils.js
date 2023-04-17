import queryString from 'query-string';

export const apicall = async ({
  method = 'GET',
  route,
  query = {},
  body = {},
}) => {
  try {
    const options = {
      method,
      ...(method === 'POST' && {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    };
    const queryParams = { token: localStorage.getItem('token'), ...query };
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}${route}?${queryString.stringify(
        queryParams,
      )}`,
      options,
    );
    const parsedResponse = await response.json();
    return parsedResponse;
  } catch (error) {
    return { success: false, error };
  }
};

export const onMessageReceive = async (message, socket) => {
  let msg = {};
  try {
    const { data } = message;
    const arrayBuffer = await data?.arrayBuffer();
    const dvu = new DataView(arrayBuffer);
    const l = dvu.byteLength;
    let position = 0;
    while (position !== l) {
      const type = dvu.getInt8(position);
      position += 1;
      switch (type) {
        case 64: {
          const lastPrice = dvu.getFloat32(position, true);
          const changeAbsolute = dvu.getFloat32(position + 14, true);
          const changePercent = dvu.getFloat32(position + 18, true);
          position += 22;
          msg = {
            lastPrice: Math.round(lastPrice),
            changeAbsolute: changeAbsolute.toFixed(2),
            changePercent: changePercent.toFixed(2),
          };
          break;
        }
        default:
          break;
      }
    }
  } catch (e) {
    console.log(e);
    socket?.close();
  }
  return msg;
};

export const calculateRSI = (lastPrice, data = []) => {
  const marketDataArray = data.slice(-14);
  const gains = [];
  const loses = [];
  const closingPrices = marketDataArray.map(marketData => marketData[4]);
  ([...closingPrices, lastPrice] || []).forEach((closingPrice, i) => {
    if (i !== 0) {
      const percentageChange = Number(
        (
          ((closingPrice - closingPrices[i - 1]) / closingPrices[i - 1]) *
          100
        ).toFixed(2),
      );
      if (percentageChange > 0) gains.push(percentageChange);
      else loses.push(-percentageChange);
    }
  });
  const gainsAverage =
    gains.length === 0
      ? 0
      : Number((gains.reduce((a, b) => a + b) / gains.length).toFixed(2));
  const losesAverage =
    loses.length === 0
      ? 0
      : Number((loses.reduce((a, b) => a + b) / loses.length).toFixed(2));
  if (losesAverage === 0) return 0;
  const relativeStrength = Number((gainsAverage / losesAverage).toFixed(2));
  const relativeStrengthIndex = Number(
    (100 - 100 / (1 + relativeStrength)).toFixed(2),
  );
  return relativeStrengthIndex;
};

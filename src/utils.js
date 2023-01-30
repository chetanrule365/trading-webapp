import queryString from 'query-string';

export const apicall = async ({ method = 'GET', route, body = {} }) => {
  try {
    const options = {
      method,
      ...(method === 'POST' && {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    };
    const queryParams = { token: localStorage.getItem('token') };
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

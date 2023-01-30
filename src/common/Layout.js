import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { apicall } from 'utils';
import { MARKET_DATA, USER } from 'routes';

function Layout({ children }) {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const userState = useSelector(state => state[USER]);

  const effect = async () => {
    const userDetails = await apicall({ route: USER });
    dispatch({ type: USER, payload: userDetails });
  };

  const getData = async () => {
    const response = await apicall({ route: MARKET_DATA });
    console.log({ priceData: response });
  };

  useEffect(() => {
    effect();
  }, []);

  useEffect(() => {
    if (userState) {
      setIsLoading(false);
      getData();
    }
  }, [JSON.stringify(userState)]);

  return <div>{isLoading ? <p>Loading...</p> : children}</div>;
}

export default Layout;

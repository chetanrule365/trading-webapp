import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';

import { apicall } from 'utils';
import { TOKEN, USER } from 'routes';

function Layout({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const userState = useSelector(state => state[USER]);

  const { success = false, requestToken = '' } = router.query;

  const effect = async () => {
    const userDetails = await apicall({ route: USER });
    dispatch({ type: USER, payload: userDetails });
  };

  const getAccessToken = async () => {
    const response = await apicall({
      route: TOKEN,
      query: { requestToken },
    });
    const {
      access_token: accessToken,
      public_access_token: publicAccessToken,
    } = response || {};
    if (accessToken) {
      localStorage.setItem('token', accessToken);
      localStorage.setItem('publicAccessToken', publicAccessToken);
      const userDetails = await apicall({ route: USER });
      dispatch({ type: USER, payload: userDetails });
      router.replace('/');
    }
  };

  useEffect(() => {
    effect();
  }, []);

  useEffect(() => {
    if (success && requestToken) {
      getAccessToken(requestToken);
    }
  }, [JSON.stringify(router.query)]);

  useEffect(() => {
    if (userState) {
      setIsLoading(false);
    }
  }, [JSON.stringify(userState)]);

  return <div>{isLoading ? <p>Loading...</p> : children}</div>;
}

export default Layout;

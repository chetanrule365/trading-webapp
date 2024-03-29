import React, { useEffect, useState } from 'react';
import Head from 'next/head';
// import { Inter } from '@next/font/google';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import debounce from 'lodash/debounce';

import { apicall, onMessageReceive, calculateRSI } from 'utils';
import { LOGIN_URL, USER, LOGOUT, HISTORICAL } from 'routes';
import clsx from 'clsx';

// const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [bankNiftyState, setBankNiftyState] = useState({});
  const userState = useSelector(state => state[USER]);
  const historicalData = useSelector(state => state[HISTORICAL]);

  const { data: { kycName = '' } = {} } = userState || {};
  const {
    lastPrice = 0,
    rsi = 0,
    changeAbsolute = 0,
    changePercent = 0,
  } = bankNiftyState || {};

  const handleLogin = async () => {
    const { loginUrl } = await apicall({ route: LOGIN_URL });
    if (loginUrl) router.push(loginUrl);
  };

  const handleLogout = async () => {
    await apicall({ route: LOGOUT });
    router.reload();
  };

  const getData = async () => {
    const newDate = new Date();
    const year = newDate.getFullYear();
    const fromMonth = String(newDate.getMonth() + 1).padStart(2, 0);
    const toMonth = String(newDate.getMonth()).padStart(2, 0);
    const date = String(newDate.getDate()).padStart(2, 0);
    const fromDate = `${year}-${fromMonth}-${date}`;
    let toDate = `${year}-${toMonth}-${date}`;
    if (newDate.getMonth() === 0) {
      toDate = `${newDate.getFullYear() - 1}-12-${date}`;
    }
    const response = await apicall({
      route: HISTORICAL,
      method: 'POST',
      body: {
        cont: 'false',
        exchange: 'NSE',
        fromDate,
        instType: 'I',
        interval: 'DAY',
        symbol: 'BANKNIFTY',
        toDate,
      },
    });
    const { data } = response || {};
    dispatch({ type: HISTORICAL, payload: data });
    const publicAccessToken = localStorage.getItem('publicAccessToken');
    const url =
      'wss://developer-ws.paytmmoney.com/broadcast/user/v1/data?' +
      `x_jwt_token=${publicAccessToken}`;

    const socket = new WebSocket(url);

    // Event triggered when user connection has successfully opened
    socket.addEventListener('open', () => {
      console.log('socket opened');
      if (socket.readyState === socket.OPEN) {
        socket.send(
          JSON.stringify([
            {
              actionType: 'ADD',
              modeType: 'LTP',
              scripType: 'INDEX',
              exchangeType: 'NSE',
              scripId: '25',
            },
          ]),
        );
      }
    });

    // Event triggered when user connection has closed
    socket.addEventListener('close', () => {
      console.log('socket disconnected');
    });

    // Event triggered when user connection gets an error
    socket.addEventListener('error', e => {
      console.log(e);
    });

    // Event triggered when user connection gets a message from the server
    socket.addEventListener('message', async message => {
      console.log('msg received');
      const msg = await onMessageReceive(message, socket);
      setBankNiftyState(state => ({
        ...state,
        ...msg,
      }));
    });
  };

  const debouncedCalculateRsi = debounce(() => {
    setBankNiftyState(state => ({
      ...state,
      rsi: calculateRSI(lastPrice, historicalData),
    }));
  }, 1000);

  useEffect(() => {
    const { success } = userState || {};
    if (userState && success !== false) {
      getData();
    }
  }, [JSON.stringify(userState)]);

  useEffect(() => {
    if (historicalData && lastPrice) {
      debouncedCalculateRsi();
    }
  }, [lastPrice, JSON.stringify(historicalData)]);

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        {kycName ? (
          <>
            <p>
              <strong>welcome</strong> {kycName}
            </p>
            <p>
              BANKNIFTY : {lastPrice}{' '}
              <span
                className={clsx({
                  'text-green-400': changeAbsolute > 0,
                  'text-red-400': changeAbsolute < 0,
                })}
              >
                {changeAbsolute}
              </span>{' '}
              <span
                className={clsx({
                  'text-green-400': changeAbsolute > 0,
                  'text-red-400': changeAbsolute < 0,
                })}
              >
                {changePercent}
              </span>
            </p>
            <p>rsi : {rsi}</p>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <button onClick={handleLogin}>Login</button>
        )}
      </main>
    </>
  );
}

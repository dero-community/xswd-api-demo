import { useContext, useEffect, useState } from "react";
import { ApiContext } from "./App";
import { to, Result, EventType } from "xswd-api";

export function Home() {
  const api = useContext(ApiContext);
  const [initializing, setInitializing] = useState(false);

  console.log({ api });

  if (api !== null) {
    if (api.initialized) {
      return (
        <>
          <Details />
          <Events />
        </>
      );
    } else {
      if (initializing) {
        return <>Initializing... check your wallet for authentication</>;
      } else {
        return (
          <button
            onClick={async () => {
              setInitializing(true);
              await api.initialize();
              setInitializing(false);
            }}
          >
            Initialize API
          </button>
        );
      }
    }
  }
  return <>Loading...</>;
}

function Details() {
  const api = useContext(ApiContext);
  const [height, setHeight] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    api?.node.GetHeight().then((response) => {
      const [err, result] = to<"daemon", "DERO.GetHeight", Result>(response);
      setHeight(result?.topoheight || null);
      if (err) {
        setError(err.error.message);
      }
    });

    api?.wallet.GetBalance().then((response) => {
      const [err, result] = to<"wallet", "GetBalance", Result>(response);
      setBalance(result?.balance || null);
      if (err) {
        setError(err.error.message);
      }
    });
  }, []);

  return (
    <div>
      <div>{height ? <>Height: {height}</> : "Requesting height..."}</div>
      <div>{balance ? <>Balance: {balance}</> : "Requesting balance..."}</div>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}

function Events() {
  const api = useContext(ApiContext);
  let [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const eventTypes: EventType[] = [
      "new_topoheight",
      "new_balance",
      "new_entry",
    ];

    eventTypes.forEach(async (event) => {
      await api?.subscribe({
        event,
        callback: (value: any) => {
          const eventData = `${new Date().toTimeString()} -> ${event}: ${JSON.stringify(
            value
          )}`;
          console.log("callback", eventData);
          events.push(eventData);
          setEvents([...events]);
        },
      });
    });
  }, [api, events, setEvents]);

  return (
    <div>
      <div>Events: </div>
      <div>
        {events.length == 0 && <>waiting for events...</>}
        {events.map((event, index) => (
          <div key={index}>{event}</div>
        ))}
      </div>
    </div>
  );
}

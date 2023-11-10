import { useContext, useEffect, useState } from "react";
import { ApiContext } from "./App";
import { to, Result, EventType } from "xswd-api";

export function Home() {
  const api = useContext(ApiContext);
  const [initializing, setInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState("");

  const initializeButton = (label: string = "Initialize API") => (
    <button
      onClick={async () => {
        setInitializationError("");
        setInitializing(true);
        try {
          if (!(await api?.initialize())) {
            setInitializationError("Authentication was refused.");
          }
        } catch (error) {
          setInitializationError(
            "check that the wallet's XSWD server is active (16)"
          );
        } finally {
          setInitializing(false);
        }
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <h1>XSWD Demo App</h1>
      {(() => {
        if (api !== null) {
          if (api.initialized) {
            return (
              <>
                <Details />
                <Events />
              </>
            );
          } else {
            if (initializationError) {
              return (
                <div style={{ color: "red" }}>
                  Error connecting with xswd: <br />
                  {initializationError} <br />
                  {initializeButton("Retry")}
                </div>
              );
            } else if (initializing) {
              return <>Initializing... check your wallet for authentication</>;
            } else {
              return initializeButton();
            }
          }
        }
        return <>Loading...</>;
      })()}
    </>
  );
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
  let [events, setEvents] = useState<
    { time: string; event: EventType; value: any }[]
  >([]);

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
          const date = new Date();
          const eventData = {
            time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
            event,
            value,
          };
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
      <table>
        <thead>
          <th>Time</th>
          <th>Event</th>
          <th>Value</th>
        </thead>
        {events.length == 0 && <>waiting for events...</>}
        {events.map(({ time, event, value }, index) => (
          <tr key={index}>
            <td>{time}</td>
            <td>{event}</td>
            <td>
              <pre>{JSON.stringify(value, undefined, 2)}</pre>
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
}

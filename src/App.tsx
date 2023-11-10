import { useEffect, useState } from "react";
import "./App.css";
import { Api, AppInfo, generateAppId } from "xswd-api";
import { createContext } from "react";
import { Home } from "./Home";

export const ApiContext = createContext<Api | null>(null);

const name = "test-app";

function App() {
  const [api, setApi] = useState<Api | null>(null);
  useEffect(() => {
    if (api == null) {
      generateAppId(name).then((id) => {
        const appInfo: AppInfo = {
          id,
          name,
          description: "test app",
        };
        setApi(new Api(appInfo));
      });
    }
  }, []);

  return (
    <ApiContext.Provider value={api}>
      <Home />
    </ApiContext.Provider>
  );
}

export default App;

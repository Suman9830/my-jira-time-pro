"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, Me } from "@/lib/client";
import Nav from "./Nav";

interface Ctx {
  me: Me | null;
  reload: () => Promise<void>;
}

const MeCtx = createContext<Ctx>({ me: null, reload: async () => {} });
export const useMe = () => useContext(MeCtx);

export default function MeProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);

  const reload = async () => setMe(await api<Me>("/api/me"));
  useEffect(() => {
    reload().catch(() => {});
  }, []);

  return (
    <MeCtx.Provider value={{ me, reload }}>
      <Nav me={me} />
      <main className="wrap">{children}</main>
    </MeCtx.Provider>
  );
}

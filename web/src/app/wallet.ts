/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";

type Eth = {
  request: (args: { method: string; params?: any[] | object }) => Promise<any>;
  on?: (event: string, cb: (...args: any[]) => void) => void;
  removeListener?: (event: string, cb: (...args: any[]) => void) => void;
};

function getEth(): Eth | null {
  const w = globalThis as any;
  return w?.ethereum || null;
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  async function refresh() {
    const eth = getEth();
    if (!eth) return;
    try {
      const accs = (await eth.request({ method: "eth_accounts" })) as string[];
      setAddress(accs?.[0] || null);
      const cid = (await eth.request({ method: "eth_chainId" })) as string;
      setChainId(parseInt(cid, 16));
    } catch {
      // ignore
    }
  }

  async function connect() {
    const eth = getEth();
    if (!eth) throw new Error("No wallet found");
    const accs = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    setAddress(accs?.[0] || null);
    const cid = (await eth.request({ method: "eth_chainId" })) as string;
    setChainId(parseInt(cid, 16));
  }

  async function switchToBase() {
    const eth = getEth();
    if (!eth) throw new Error("No wallet found");
    // Base mainnet
    const baseChainId = "0x2105";
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: baseChainId }] });
    } catch (e: any) {
      // If not added
      if (e?.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: baseChainId,
              chainName: "Base",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://mainnet.base.org"],
              blockExplorerUrls: ["https://basescan.org"],
            },
          ],
        });
      } else {
        throw e;
      }
    }
    await refresh();
  }

  useEffect(() => {
    refresh();
    const eth = getEth();
    if (!eth?.on) return;

    const onAccounts = (accs: string[]) => setAddress(accs?.[0] || null);
    const onChain = (cid: string) => setChainId(parseInt(cid, 16));

    eth.on("accountsChanged", onAccounts);
    eth.on("chainChanged", onChain);

    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  return { address, chainId, connect, switchToBase, refresh };
}

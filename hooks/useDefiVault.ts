import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { DEFI_VAULT_ADDRESS, WAVAX_ADDRESS } from "../utils/constants";

// ABI snippets for the required functions
const DEFI_VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "path", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
      { name: "adapters", type: "address[]" },
      { name: "isAVAX", type: "bool" },
    ],
    outputs: [],
  },
];

const WAVAX_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
];

export default function useDefiVault() {
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isFindingBestPath, setIsFindingBestPath] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getProvider = useCallback(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return new ethers.providers.Web3Provider((window as any).ethereum);
    }
    throw new Error("No ethereum provider found");
  }, []);

  const getSigner = useCallback(() => {
    const provider = getProvider();
    return provider.getSigner();
  }, [getProvider]);

  useEffect(() => {
    const handleNetworkChange = () => {
      // Reset states when network changes
      setIsApproving(false);
      setIsDepositing(false);
      setIsFindingBestPath(false);
      setTransactionHash(null);
      setError(null);
    };

    const ethereum = (window as any).ethereum;
    if (ethereum) {
      ethereum.on("chainChanged", handleNetworkChange);
    }

    return () => {
      if (ethereum) {
        ethereum.removeListener("chainChanged", handleNetworkChange);
      }
    };
  }, []);

  const findBestPath = async (amount: string, isAVAX: boolean) => {
    setIsFindingBestPath(true);
    setError(null);
    try {
      const response = await fetch("/api/findBestPath", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountIn: amount, isAVAX }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch best path");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error finding best path:", error);
      setError("Failed to find best path. Please try again.");
      throw error;
    } finally {
      setIsFindingBestPath(false);
    }
  };

  const handleDeposit = async (amount: string, isAVAX: boolean) => {
    setIsDepositing(true);
    setError(null);
    setTransactionHash(null);
    try {
      const { path, amounts, adapters } = await findBestPath(amount, isAVAX);

      const signer = getSigner();
      const contract = new ethers.Contract(
        DEFI_VAULT_ADDRESS,
        DEFI_VAULT_ABI,
        signer
      );

      const amountBigNumber = ethers.utils.parseEther(amount);

      const tx = await contract.deposit(path, amounts, adapters, isAVAX, {
        value: isAVAX ? amountBigNumber : 0,
      });

      setTransactionHash(tx.hash);
      await tx.wait();
    } catch (error) {
      console.error("Deposit failed:", error);
      setError("Deposit failed. Please try again.");
      throw error;
    } finally {
      setIsDepositing(false);
    }
  };

  const handleApproveWAVAX = async (amount: string) => {
    setIsApproving(true);
    setError(null);
    setTransactionHash(null);
    try {
      const signer = getSigner();
      const contract = new ethers.Contract(WAVAX_ADDRESS, WAVAX_ABI, signer);

      const amountBigNumber = ethers.utils.parseEther(amount);

      const tx = await contract.approve(DEFI_VAULT_ADDRESS, amountBigNumber);
      setTransactionHash(tx.hash);
      await tx.wait();
    } catch (error) {
      console.error("WAVAX approval failed:", error);
      setError("WAVAX approval failed. Please try again.");
      throw error;
    } finally {
      setIsApproving(false);
    }
  };

  return {
    deposit: handleDeposit,
    approveWAVAX: handleApproveWAVAX,
    isApproving,
    isDepositing,
    isFindingBestPath,
    transactionHash,
    error,
  };
}

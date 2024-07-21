import { useState, useEffect } from "react";
import { ethers } from "ethers";
import useDefiVault from "../hooks/useDefiVault";
import TokenSelection from "./TokenSelection";
import { WAVAX_ADDRESS } from "../utils/constants";

export default function DepositForm() {
  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState(0);
  const [selectedTab, setSelectedTab] = useState("Mint");
  const [selectedToken, setSelectedToken] = useState("AVAX");
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [networkError, setNetworkError] = useState<string | null>(null);

  const {
    deposit,
    approveWAVAX,
    isApproving,
    isDepositing,
    isFindingBestPath,
    transactionHash,
    error: vaultError,
  } = useDefiVault();

  useEffect(() => {
    const connectWallet = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const provider = new ethers.providers.Web3Provider(
          (window as any).ethereum
        );
        try {
          await provider.send("eth_requestAccounts", []);
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          setAddress(address);

          // Check if we're on the correct network (Avalanche C-Chain)
          const network = await provider.getNetwork();
          if (network.chainId !== 43114) {
            setNetworkError("Please connect to the Avalanche C-Chain network.");
          } else {
            setNetworkError(null);
          }
        } catch (error) {
          console.error("Failed to connect wallet:", error);
          setNetworkError("Failed to connect wallet. Please try again.");
        }
      } else {
        setNetworkError("No Ethereum wallet found. Please install MetaMask.");
      }
    };

    connectWallet();

    // Listen for network changes
    const handleNetworkChange = () => {
      connectWallet();
    };

    if ((window as any).ethereum) {
      (window as any).ethereum.on("networkChanged", handleNetworkChange);
    }

    return () => {
      if ((window as any).ethereum) {
        (window as any).ethereum.removeListener(
          "networkChanged",
          handleNetworkChange
        );
      }
    };
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (address) {
        const provider = new ethers.providers.Web3Provider(
          (window as any).ethereum
        );
        let balance;
        if (selectedToken === "WAVAX") {
          const contract = new ethers.Contract(
            WAVAX_ADDRESS,
            ["function balanceOf(address) view returns (uint256)"],
            provider
          );
          balance = await contract.balanceOf(address);
        } else {
          balance = await provider.getBalance(address);
        }
        setBalance(ethers.utils.formatEther(balance));
      }
    };

    fetchBalance();
  }, [address, selectedToken]);

  const maxAmount = parseFloat(balance);

  useEffect(() => {
    if (maxAmount > 0) {
      const newAmount = ((maxAmount * sliderValue) / 100).toFixed(6);
      setAmount(newAmount);
    }
  }, [sliderValue, maxAmount]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (maxAmount > 0) {
      setSliderValue(parseInt(e.target.value));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setAmount(inputValue);
    if (maxAmount > 0) {
      const percentage = (parseFloat(inputValue) / maxAmount) * 100;
      setSliderValue(Math.min(Math.max(percentage, 0), 100));
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) > maxAmount) return;
    try {
      if (selectedToken === "WAVAX") {
        await approveWAVAX(amount);
      }
      await deposit(amount, selectedToken === "AVAX");
    } catch (error) {
      console.error("Deposit failed:", error);
    }
  };

  const isDepositDisabled =
    isApproving ||
    isDepositing ||
    isFindingBestPath ||
    !amount ||
    parseFloat(amount) === 0 ||
    parseFloat(amount) > maxAmount ||
    !!networkError;

  return (
    <div className="card max-w-2xl mx-auto p-8 rounded-2xl">
      {networkError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {networkError}</span>
        </div>
      )}
      <div className="flex mb-6 rounded-xl overflow-hidden">
        <button
          className={`flex-1 py-3 text-lg font-semibold ${
            selectedTab === "Mint" ? "btn-primary" : "btn-secondary"
          }`}
          onClick={() => setSelectedTab("Mint")}
        >
          Mint
        </button>
        <button
          className={`flex-1 py-3 text-lg font-semibold ${
            selectedTab === "Redeem" ? "btn-primary" : "btn-secondary"
          }`}
          onClick={() => setSelectedTab("Redeem")}
        >
          Redeem
        </button>
      </div>
      <TokenSelection
        selectedToken={selectedToken}
        setSelectedToken={setSelectedToken}
      />
      <div className="mb-6">
        <input
          type="number"
          className="input text-xl py-3 rounded-xl"
          placeholder="0.0"
          value={amount}
          onChange={handleInputChange}
        />
        <div className="text-right text-gray-400 mt-2">
          Max: {balance} {selectedToken}
        </div>
      </div>
      <div className="mb-6">
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          className="w-full rounded-lg"
          onChange={handleSliderChange}
        />
        <div className="flex justify-between text-gray-400 mt-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
      <button
        className={`btn w-full rounded-xl py-4 text-lg font-semibold ${
          isDepositDisabled
            ? "btn-secondary opacity-50 cursor-not-allowed"
            : "btn-primary"
        }`}
        onClick={handleDeposit}
        disabled={isDepositDisabled}
      >
        {isApproving
          ? "Approving..."
          : isDepositing
          ? "Depositing..."
          : isFindingBestPath
          ? "Finding Best Path..."
          : `Deposit ${selectedToken}`}
      </button>
      {vaultError && <div className="text-red-500 mt-2">{vaultError}</div>}
      {transactionHash && (
        <div className="text-green-500 mt-2">
          Transaction submitted:{" "}
          <a
            href={`https://snowtrace.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Explorer
          </a>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";

interface TokenSelectionProps {
  selectedToken: string;
  setSelectedToken: (token: string) => void;
}

interface TokenInfo {
  symbol: string;
  name: string;
  logo: string;
  price: number;
}

const tokenInfo: { [key: string]: TokenInfo } = {
  AVAX: {
    symbol: "AVAX",
    name: "Avalanche",
    logo: "/logo.png", // Make sure to add this image to your public folder
    price: 0, // This will be updated dynamically
  },
  WAVAX: {
    symbol: "WAVAX",
    name: "Wrapped AVAX",
    logo: "/logo.png", // Make sure to add this image to your public folder
    price: 0, // This will be updated dynamically
  },
};

export default function TokenSelection({
  selectedToken,
  setSelectedToken,
}: TokenSelectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prices, setPrices] = useState<{ [key: string]: number }>({
    AVAX: 0,
    WAVAX: 0,
  });

  useEffect(() => {
    // Fetch token prices
    const fetchPrices = async () => {
      // This is a placeholder. In a real app, you'd fetch prices from an API
      setPrices({
        AVAX: 34.65,
        WAVAX: 34.7,
      });
    };

    fetchPrices();
    // Set up an interval to fetch prices regularly
    const interval = setInterval(fetchPrices, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (token: string) => {
    setSelectedToken(token);
    setIsOpen(false);
  };

  const selected = tokenInfo[selectedToken];

  return (
    <div className="relative mb-6">
      <div
        className="flex items-center justify-between bg-gray-800 p-4 rounded-xl cursor-pointer"
        onClick={toggleDropdown}
      >
        <div className="flex items-center">
          <img
            src={selected.logo}
            alt={selected.name}
            className="w-8 h-8 mr-3"
          />
          <span className="font-bold text-xl">{selected.symbol}</span>
        </div>
        <span className="text-gray-400">
          $ {prices[selectedToken].toFixed(2)}
        </span>
        <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute w-full mt-2 bg-gray-800 rounded-xl shadow-lg z-10">
          {Object.values(tokenInfo).map((token) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between p-4 hover:bg-gray-700 cursor-pointer"
              onClick={() => handleSelect(token.symbol)}
            >
              <div className="flex items-center">
                <img
                  src={token.logo}
                  alt={token.name}
                  className="w-8 h-8 mr-3"
                />
                <span className="font-bold">{token.symbol}</span>
              </div>
              <span className="text-gray-400">$ 30</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

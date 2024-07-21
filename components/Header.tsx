import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

export default function Header() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  return (
    <header className="bg-card-background shadow">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* <img src="/logo.png" alt="Logo" className="h-8 w-8" /> */}
          <Link href="/" className="btn btn-primary">
            Home
          </Link>
          <Link href="/dashboard" className="text-gray-300 hover:text-white">
            Dashboard
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <button className="btn btn-secondary">!</button>
          {isConnected ? (
            <button onClick={() => disconnect()} className="btn btn-primary">
              Disconnect {address?.slice(0, 6)}...{address?.slice(-4)}
            </button>
          ) : (
            <button onClick={() => connect()} className="btn btn-primary">
              Connect Wallet
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { YAK_ROUTER_ADDRESS, WAVAX_ADDRESS } from "../../utils/constants";

const YAK_ROUTER_ABI = [
  "function findBestPath(uint256 amountIn, address tokenIn, address tokenOut, uint maxSteps) view returns (uint256[] memory amounts, address[] memory adapters, address[] memory path)",
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { amountIn, isAVAX } = req.body;

  if (!amountIn) {
    return res.status(400).json({ message: "Missing amountIn parameter" });
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(
      "https://api.avax.network/ext/bc/C/rpc"
    );
    const yakRouter = new ethers.Contract(
      YAK_ROUTER_ADDRESS,
      YAK_ROUTER_ABI,
      provider
    );

    const sAVAXAddress = "0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE";
    const tokenIn = isAVAX ? WAVAX_ADDRESS : WAVAX_ADDRESS; // Use WAVAX for both cases in findBestPath
    const tokenOut = sAVAXAddress;

    const bestPath = await yakRouter.findBestPath(
      amountIn,
      tokenIn,
      tokenOut,
      3
    );

    res.status(200).json({
      path: bestPath.path,
      amounts: bestPath.amounts.map((amount: ethers.BigNumber) =>
        amount.toString()
      ),
      adapters: bestPath.adapters,
    });
  } catch (error) {
    console.error("Error in findBestPath:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import * as anchor from "@project-serum/anchor";
import * as idl from "../../coin_flip.json";
import { PublicKey } from "@solana/web3.js";

const programId = "2WWFGRA4f81ubcjtkh112obV8brzF6nkhBCDGh7Z8hqo";

type Data = {
  coinFlipPDA: string;
  vendor: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  let { playerPublicKey, amount } = JSON.parse(req.body);

  playerPublicKey = new PublicKey(playerPublicKey);
  amount = new anchor.BN(amount);

  const provider = anchor.Provider.local("http://127.0.0.1:8899");
  anchor.setProvider(provider);

  const vendor = anchor.web3.Keypair.generate();
  let sig = await provider.connection.requestAirdrop(
    playerPublicKey,
    1000000000000
  );
  await provider.connection.confirmTransaction(sig);
  let sig2 = await provider.connection.requestAirdrop(
    vendor.publicKey,
    1000000000000
  );

  await provider.connection.confirmTransaction(sig2);

  // Start

  const program = new anchor.Program(idl as any, programId, provider);

  const [coinFlipPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode("coin-flip"),
      vendor.publicKey.toBuffer(),
      playerPublicKey.toBuffer(),
    ],
    program.programId
  );

  const setupTx = await program.rpc.setup(playerPublicKey, amount, {
    accounts: {
      coinFlip: coinFlipPDA,
      vendor: vendor.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    },
    signers: [vendor],
  });

  await provider.connection.confirmTransaction(setupTx);

  res.status(200).json({
    coinFlipPDA: coinFlipPDA.toString(),
    vendor: vendor.publicKey.toString(),
  });
}

import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { CoinFlip } from "../target/types/coin_flip";
const { SystemProgram, LAMPORTS_PER_SOL } = anchor.web3;

import * as assert from "assert";

async function play(program, coinFlip, player) {
  const playerChoice = 1;
  await program.rpc.play(playerChoice, {
    accounts: {
      player: player.publicKey,
      coinFlip,
    },
    signers: player instanceof (anchor.Wallet as any) ? [] : [player],
  });

  const gameState = await program.account.coinFlip.fetch(coinFlip);
  console.log("playerTwo: ", player.publicKey.toString());
  console.log("Winner:", gameState.state.finished.winner.toString());
}

describe("coin-flip", () => {
  const provider = anchor.Provider.local("http://127.0.0.1:8899");
  anchor.setProvider(provider);
  const program = anchor.workspace.CoinFlip;

  it("setups the game", async () => {
    const coinFlipKeypair = anchor.web3.Keypair.generate();
    const playerOne = program.provider.wallet;
    const playerTwo = anchor.web3.Keypair.generate();
    await program.rpc.setup(playerTwo.publicKey, {
      accounts: {
        coinFlip: coinFlipKeypair.publicKey,
        playerOne: playerOne.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [coinFlipKeypair],
    });
  });

  it("plays the game", async () => {
    const coinFlipKeypair = anchor.web3.Keypair.generate();
    const playerOne = program.provider.wallet;
    const playerTwo = anchor.web3.Keypair.generate();
    await program.rpc.setup(playerTwo.publicKey, {
      accounts: {
        coinFlip: coinFlipKeypair.publicKey,
        playerOne: playerOne.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [coinFlipKeypair],
    });

    await play(program, coinFlipKeypair.publicKey, playerTwo);
  });
});

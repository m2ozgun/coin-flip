import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { CoinFlip } from "../target/types/coin_flip";
const { SystemProgram, LAMPORTS_PER_SOL } = anchor.web3;

import * as assert from "assert";
const program = anchor.workspace.CoinFlip;

function programForUser(user) {
  return new anchor.Program(program.idl, program.programId, user.provider);
}

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

  it("setups the game", async () => {
    const playerOne = program.provider.wallet;
    const playerTwo = anchor.web3.Keypair.generate();
    const playerOneProgram = programForUser(playerOne);

    const [coinFlipPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("coin-flip"),
        playerOne.publicKey.toBuffer(),
        playerTwo.publicKey.toBuffer(),
      ],
      program.programId
    );

    await playerOneProgram.rpc.setup(playerTwo.publicKey, {
      accounts: {
        coinFlip: coinFlipPDA,
        playerOne: playerOne.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });
  });

  it("plays the game", async () => {
    const playerOne = program.provider.wallet;
    const playerTwo = anchor.web3.Keypair.generate();
    const playerOneProgram = programForUser(playerOne);
    const playerTwoProgram = programForUser(playerTwo);

    const [coinFlipPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("coin-flip"),
        playerOne.publicKey.toBuffer(),
        playerTwo.publicKey.toBuffer(),
      ],
      program.programId
    );

    await playerOneProgram.rpc.setup(playerTwo.publicKey, {
      accounts: {
        coinFlip: coinFlipPDA,
        playerOne: playerOne.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    await play(playerTwoProgram, coinFlipPDA, playerTwo);
  });
});

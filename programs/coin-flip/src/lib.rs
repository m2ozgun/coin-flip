use anchor_lang::prelude::*;
use num_derive::*;
use num_traits::*;

declare_id!("2WWFGRA4f81ubcjtkh112obV8brzF6nkhBCDGh7Z8hqo");

#[program]
pub mod coin_flip {
    use super::*;

    pub fn setup(ctx: Context<Setup>, player_two: Pubkey) -> Result<()> {
        msg!("setup: {}", player_two);

        let coin_flip = &mut ctx.accounts.coin_flip;

        coin_flip.players = [ctx.accounts.player_one.key(), player_two];
        coin_flip.player_one_seed = 124;
        Ok(())
    }

    
    pub fn play(ctx: Context<Play>, player_two_choice: u8) -> Result<()> {
        let coin_flip = &mut ctx.accounts.coin_flip;
        let player_two_seed = 123;

        // 0: Tails, 1: Heads
        let player_two_side = if player_two_choice == 0 {
            Side::Tails
        } else {
            Side::Heads
        };
        
        coin_flip.play(player_two_seed, player_two_side)
    }

}

#[derive(Accounts)]
pub struct Setup<'info> {
    #[account(init, payer = player_one, space = CoinFlip::LEN)]
    pub coin_flip: Account<'info, CoinFlip>,
    #[account(mut)]
    pub player_one: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Play<'info> {
    #[account(mut)]
    pub coin_flip: Account<'info, CoinFlip>,
    pub player: Signer<'info>
}

#[account]
#[derive(Default)] 
pub struct CoinFlip {
    players: [Pubkey; 2], 
    player_one_seed: i64,
    state: CoinFlipState, 
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CoinFlipState {
    Active,
    Finished { winner: Pubkey },
}

impl Default for CoinFlipState {
    fn default() -> Self {
        Self::Active
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, FromPrimitive, ToPrimitive, Copy, Clone, PartialEq, Eq)]
pub enum Side {
    Heads,
    Tails
}


impl CoinFlip {
    const LEN: usize = 64 + 8 + 33 + 8;

    fn flip_side(&self, flip_number: i64) -> Side {
        if flip_number == 0 {
            Side::Tails
        } else {
            Side::Heads
        }
    }

    fn flip(&self, player_two_seed: i64) -> Side {
        let clock: Clock = Clock::get().unwrap();
        let flip_number: i64 = (self.player_one_seed + player_two_seed + clock.unix_timestamp) % 2;

        self.flip_side(flip_number)
    }

    pub fn play(&mut self, player_two_seed: i64, player_two_side: Side) -> Result<()> {

        let flip_result = self.flip(player_two_seed);

        if flip_result == player_two_side {
            self.state = CoinFlipState::Finished {
                winner: self.players[1]
            };
        } else {
            self.state = CoinFlipState::Finished {
                winner: self.players[0]
            };
        }

        Ok(())
    }
    
}


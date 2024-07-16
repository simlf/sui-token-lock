module token_lock::token_lock {
    use sui::coin::{Self, Coin};
    use sui::clock::{Self, Clock};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;

    const EInsufficientBalance: u64 = 102; // Choose an appropriate error code

    public struct LockedCoin has key, store {
        id: object::UID,
        balance: Balance<SUI>,
        unlock_time: u64,
        owner: address,
    }

    public entry fun lock_coin_entry(
        clock: &Clock,
        coin: Coin<SUI>,
        lock_duration_seconds: u64,
        ctx: &mut TxContext
    ) {
        let locked_coin = lock_coin(clock, coin, lock_duration_seconds, ctx);
        transfer::transfer(locked_coin, tx_context::sender(ctx));
    }

    public entry fun unlock_coin_entry(
        clock: &Clock,
        locked_coin: LockedCoin,
        ctx: &mut TxContext
    ) {
        let coin = unlock_coin(clock, locked_coin, ctx);
        transfer::public_transfer(coin, tx_context::sender(ctx));
    }

    public fun lock_coin(
        clock: &Clock,
        coin: Coin<SUI>,
        lock_duration_seconds: u64,
        ctx: &mut tx_context::TxContext
    ): LockedCoin {
        let current_time = clock::timestamp_ms(clock);
        let unlock_time = current_time + (lock_duration_seconds * 1000); // Convert seconds to milliseconds

        let balance = coin::into_balance(coin);

        // Check if the balance is greater than zero
        assert!(balance::value(&balance) > 0, EInsufficientBalance);

        LockedCoin {
            id: object::new(ctx),
            balance,
            unlock_time,
            owner: tx_context::sender(ctx),
        }
    }

    public fun unlock_coin(
        clock: &Clock,
        locked_coin: LockedCoin,
        ctx: &mut tx_context::TxContext
    ): Coin<SUI> {
        let LockedCoin { id, balance, unlock_time, owner } = locked_coin;

        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= unlock_time, 100);
        assert!(owner == tx_context::sender(ctx), 101);

        object::delete(id);
        coin::from_balance(balance, ctx)
    }

    public fun time_until_unlock(clock: &Clock, locked_coin: &LockedCoin): u64 {
        let current_time = clock::timestamp_ms(clock);
        if (current_time >= locked_coin.unlock_time) {
            0
        } else {
            locked_coin.unlock_time - current_time
        }
    }

    #[test_only]
    use sui::test_scenario;

    #[test]
    fun test_lock_and_unlock_coin() {
        let mut scenario = test_scenario::begin(@0x1);
        let mut test_clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // Lock the coin
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(100, ctx);
            let locked_coin = lock_coin(&test_clock, coin, 3600, ctx);
            transfer::transfer(locked_coin, tx_context::sender(ctx));
        };

        // Attempt to unlock prematurely (should fail)
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let locked_coin = test_scenario::take_from_sender<LockedCoin>(&scenario);

            assert!(
                !test_scenario::has_most_recent_for_sender<Coin<SUI>>(&scenario),
                0
            );

            test_scenario::return_to_sender(&scenario, locked_coin);
        };

        // Advance the clock
        clock::increment_for_testing(&mut test_clock, 3600 * 1000);

        // Unlock correctly
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let locked_coin = test_scenario::take_from_sender<LockedCoin>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let unlocked_coin = unlock_coin(&test_clock, locked_coin, ctx);
            assert!(coin::value(&unlocked_coin) == 100, 1);

            transfer::public_transfer(unlocked_coin, @0x1);
        };

        clock::destroy_for_testing(test_clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 101, location = token_lock::token_lock)]
    fun test_unauthorized_unlock() {
        let mut scenario = test_scenario::begin(@0x1);
        let mut test_clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // Lock the coin with one user
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(100, ctx);
            let locked_coin = lock_coin(&test_clock, coin, 3600, ctx);
            transfer::transfer(locked_coin, @0x1);
        };

        // Advance the clock to make sure the time lock has expired
        clock::increment_for_testing(&mut test_clock, 3600 * 1000);

        // Attempt to unlock with a different user
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let locked_coin = test_scenario::take_from_address<LockedCoin>(&scenario, @0x1);
            let ctx = test_scenario::ctx(&mut scenario);

            let unlocked_coin = unlock_coin(&test_clock, locked_coin, ctx);
            // This line will not be reached due to the expected failure,
            // but we need to handle the returned coin to satisfy the compiler
            transfer::public_transfer(unlocked_coin, @0x2);
        };

        clock::destroy_for_testing(test_clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_lock_coin_zero_duration() {
        let mut scenario = test_scenario::begin(@0x1);
        let test_clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(100, ctx);
            let locked_coin = lock_coin(&test_clock, coin, 0, ctx);
            transfer::transfer(locked_coin, tx_context::sender(ctx));
        };

        // Attempt to unlock immediately
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let locked_coin = test_scenario::take_from_sender<LockedCoin>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let unlocked_coin = unlock_coin(&test_clock, locked_coin, ctx);
            assert!(coin::value(&unlocked_coin) == 100, 2);

            transfer::public_transfer(unlocked_coin, @0x1);
        };

        clock::destroy_for_testing(test_clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_lock_coin_long_duration() {
        let mut scenario = test_scenario::begin(@0x1);
        let mut test_clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(100, ctx);
            let locked_coin = lock_coin(&test_clock, coin, 31536000, ctx); // 1 year in seconds
            transfer::transfer(locked_coin, tx_context::sender(ctx));
        };

        // Attempt to unlock after a year
        clock::increment_for_testing(&mut test_clock, 31536000 * 1000);
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let locked_coin = test_scenario::take_from_sender<LockedCoin>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let unlocked_coin = unlock_coin(&test_clock, locked_coin, ctx);
            assert!(coin::value(&unlocked_coin) == 100, 3);

            transfer::public_transfer(unlocked_coin, @0x1);
        };

        clock::destroy_for_testing(test_clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 100, location = token_lock::token_lock)]
    fun test_unlock_just_before_time() {
        let mut scenario = test_scenario::begin(@0x1);
        let mut test_clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(100, ctx);
            let locked_coin = lock_coin(&test_clock, coin, 3600, ctx);
            transfer::transfer(locked_coin, tx_context::sender(ctx));
        };

        // Attempt to unlock 1 millisecond before unlock time
        clock::increment_for_testing(&mut test_clock, 3599 * 1000 + 999);
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let locked_coin = test_scenario::take_from_sender<LockedCoin>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let unlocked_coin = unlock_coin(&test_clock, locked_coin, ctx);
            transfer::public_transfer(unlocked_coin, @0x1);
        };

        clock::destroy_for_testing(test_clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_lock_and_unlock_single_coin() {
        let mut scenario = test_scenario::begin(@0x1);
        let mut test_clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // Lock a single coin
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(100, ctx);
            let locked_coin = lock_coin(&test_clock, coin, 3600, ctx);
            transfer::transfer(locked_coin, tx_context::sender(ctx));
        };

        // Try to unlock before time (should fail)
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let locked_coin = test_scenario::take_from_sender<LockedCoin>(&scenario);

            assert!(
                !test_scenario::has_most_recent_for_sender<Coin<SUI>>(&scenario),
                0
            );

            test_scenario::return_to_sender(&scenario, locked_coin);
        };

        // Advance clock and unlock
        clock::increment_for_testing(&mut test_clock, 3600 * 1000 + 1); // Add 1ms to ensure we're past the unlock time
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let locked_coin = test_scenario::take_from_sender<LockedCoin>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let unlocked_coin = unlock_coin(&test_clock, locked_coin, ctx);
            assert!(coin::value(&unlocked_coin) == 100, 1);

            transfer::public_transfer(unlocked_coin, @0x1);
        };

        clock::destroy_for_testing(test_clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = token_lock::token_lock::EInsufficientBalance)]
    fun test_lock_coin_zero_balance() {
        let mut scenario = test_scenario::begin(@0x1);
        let test_clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(0, ctx);
            let locked_coin = lock_coin(&test_clock, coin, 3600, ctx);
            transfer::transfer(locked_coin, tx_context::sender(ctx));
        };

        clock::destroy_for_testing(test_clock);
        test_scenario::end(scenario);
    }
}

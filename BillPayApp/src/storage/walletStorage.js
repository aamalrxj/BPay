import AsyncStorage from "@react-native-async-storage/async-storage";

const WALLET_BALANCE_KEY =
    "billpay_wallet_balance";

const DEFAULT_BALANCE = 5000;

export async function getWalletBalance() {
    try {
        const savedBalance =
            await AsyncStorage.getItem(
                WALLET_BALANCE_KEY
            );

        if (savedBalance === null) {
            await saveWalletBalance(
                DEFAULT_BALANCE
            );

            return DEFAULT_BALANCE;
        }

        const parsedBalance =
            Number(savedBalance);

        if (Number.isNaN(parsedBalance)) {
            return DEFAULT_BALANCE;
        }

        return parsedBalance;
    } catch (error) {
        console.error(
            "Unable to read wallet balance:",
            error
        );

        return DEFAULT_BALANCE;
    }
}

export async function saveWalletBalance(
    balance
) {
    await AsyncStorage.setItem(
        WALLET_BALANCE_KEY,
        Number(balance).toString()
    );
}

export async function addToWallet(amount) {
    const currentBalance =
        await getWalletBalance();

    const updatedBalance =
        currentBalance + Number(amount);

    await saveWalletBalance(updatedBalance);

    return updatedBalance;
}

export async function deductFromWallet(amount) {
    const currentBalance =
        await getWalletBalance();

    const paymentAmount = Number(amount);

    if (
        Number.isNaN(paymentAmount) ||
        paymentAmount <= 0
    ) {
        throw new Error(
            "The payment amount is invalid."
        );
    }

    if (currentBalance < paymentAmount) {
        throw new Error(
            "Insufficient wallet balance."
        );
    }

    const updatedBalance =
        currentBalance - paymentAmount;

    await saveWalletBalance(updatedBalance);

    return updatedBalance;
}
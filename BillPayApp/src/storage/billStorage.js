import AsyncStorage from "@react-native-async-storage/async-storage";

const BILLS_STORAGE_KEY =
    "billpay_saved_bills";

export async function getSavedBills() {
    try {
        const storedValue =
            await AsyncStorage.getItem(
                BILLS_STORAGE_KEY
            );

        if (!storedValue) {
            return [];
        }

        const parsedValue =
            JSON.parse(storedValue);

        if (!Array.isArray(parsedValue)) {
            return [];
        }

        return parsedValue.filter(
            (savedBill) =>
                savedBill?.payment
                    ?.paymentId &&
                savedBill?.merchant &&
                savedBill?.invoice
                    ?.invoiceNumber &&
                Array.isArray(
                    savedBill?.invoice
                        ?.products
                )
        );
    } catch (error) {
        console.error(
            "Unable to load saved invoices:",
            error
        );

        return [];
    }
}

export async function saveBill(
    newBill
) {
    if (
        !newBill?.payment?.paymentId ||
        !newBill?.merchant ||
        !newBill?.invoice
            ?.invoiceNumber ||
        !Array.isArray(
            newBill?.invoice?.products
        )
    ) {
        throw new Error(
            "The invoice does not contain complete information."
        );
    }

    const existingBills =
        await getSavedBills();

    const alreadySaved =
        existingBills.some(
            (savedBill) =>
                savedBill.payment
                    .paymentId ===
                newBill.payment.paymentId
        );

    if (alreadySaved) {
        throw new Error(
            "This invoice is already stored."
        );
    }

    const updatedBills = [
        newBill,
        ...existingBills,
    ];

    await AsyncStorage.setItem(
        BILLS_STORAGE_KEY,
        JSON.stringify(updatedBills)
    );

    return updatedBills;
}

export async function clearSavedBills() {
    await AsyncStorage.removeItem(
        BILLS_STORAGE_KEY
    );
}
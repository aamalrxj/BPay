import AsyncStorage from "@react-native-async-storage/async-storage";


const EXPENSE_KEY =
    "bpay_expenses";

const INCOME_KEY =
    "bpay_income";

const EMI_KEY =
    "bpay_emi";

const BUDGET_KEY =
    "bpay_budgets";


function safeParse(
    value,
    fallback
) {
    try {
        if (!value) {
            return fallback;
        }

        return JSON.parse(
            value
        );
    } catch {
        return fallback;
    }
}


export async function getExpenses() {
    const data =
        await AsyncStorage.getItem(
            EXPENSE_KEY
        );

    const parsed =
        safeParse(
            data,
            []
        );

    return Array.isArray(
        parsed
    )
        ? parsed
        : [];
}


export async function saveExpense(
    expense
) {
    const expenses =
        await getExpenses();

    const record = {
        id:
            expense.id ||
            `EXP-${Date.now()}`,

        ...expense,
    };

    const updated = [
        record,
        ...expenses,
    ];

    await AsyncStorage.setItem(
        EXPENSE_KEY,
        JSON.stringify(
            updated
        )
    );

    return updated;
}


export async function replaceExpenses(
    expenses
) {
    await AsyncStorage.setItem(
        EXPENSE_KEY,
        JSON.stringify(
            expenses
        )
    );
}


export async function getIncome() {
    const data =
        await AsyncStorage.getItem(
            INCOME_KEY
        );

    const parsed =
        safeParse(
            data,
            []
        );

    return Array.isArray(
        parsed
    )
        ? parsed
        : [];
}


export async function saveIncome(
    income
) {
    const incomes =
        await getIncome();

    const record = {
        id:
            income.id ||
            income.incomeId ||
            `INC-${Date.now()}`,

        ...income,
    };

    const updated = [
        record,
        ...incomes,
    ];

    await AsyncStorage.setItem(
        INCOME_KEY,
        JSON.stringify(
            updated
        )
    );

    return updated;
}


export async function replaceIncome(
    incomes
) {
    await AsyncStorage.setItem(
        INCOME_KEY,
        JSON.stringify(
            incomes
        )
    );
}


export async function getEmis() {
    const data =
        await AsyncStorage.getItem(
            EMI_KEY
        );

    const parsed =
        safeParse(
            data,
            []
        );

    return Array.isArray(
        parsed
    )
        ? parsed
        : [];
}


export async function saveEmi(
    emi
) {
    const emis =
        await getEmis();

    const record = {
        id:
            emi.id ||
            `EMI-${Date.now()}`,

        paid: false,

        ...emi,
    };

    const updated = [
        record,
        ...emis,
    ];

    await AsyncStorage.setItem(
        EMI_KEY,
        JSON.stringify(
            updated
        )
    );

    return updated;
}


export async function getBudgets() {
    const data =
        await AsyncStorage.getItem(
            BUDGET_KEY
        );

    const parsed =
        safeParse(
            data,
            {}
        );

    return (
        parsed &&
        typeof parsed ===
            "object"
    )
        ? parsed
        : {};
}


export async function saveBudgets(
    budgets
) {
    await AsyncStorage.setItem(
        BUDGET_KEY,
        JSON.stringify(
            budgets
        )
    );
}
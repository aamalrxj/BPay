import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    getBudgets,
    getEmis,
    getExpenses,
    getIncome,
    replaceExpenses,
    replaceIncome,
    saveBudgets,
    saveEmi,
    saveExpense,
    saveIncome,
} from "./src/storage";

import {
    calculateSummary,
} from "./src/finance";


const API_BASE_URL =
    "http://localhost:5000";


const CATEGORIES = [
    "Grocery",
    "Electronics",
    "Clothing",
    "Medical",
    "Personal Care",
    "Household",
    "Stationery",
    "Food & Dining",
    "Travel",
    "Automotive",
    "Education",
    "Entertainment",
    "Bills",
    "EMI",
    "Other",
];


export default function App() {
    const [
        income,
        setIncome,
    ] = useState([]);

    const [
        expenses,
        setExpenses,
    ] = useState([]);

    const [
        emis,
        setEmis,
    ] = useState([]);

    const [
        budgets,
        setBudgets,
    ] = useState({});

    const [
        screen,
        setScreen,
    ] = useState(
        "home"
    );

    const [
        title,
        setTitle,
    ] = useState("");

    const [
        amount,
        setAmount,
    ] = useState("");

    const [
        type,
        setType,
    ] = useState(
        "expense"
    );

    const [
        selectedCategory,
        setSelectedCategory,
    ] = useState(
        "Grocery"
    );

    const [
        budgetCategory,
        setBudgetCategory,
    ] = useState(
        "Grocery"
    );

    const [
        budgetAmount,
        setBudgetAmount,
    ] = useState("");

    const [
        isSyncing,
        setIsSyncing,
    ] = useState(false);

    const [
        syncMessage,
        setSyncMessage,
    ] = useState("");


    async function loadData() {
        const [
            storedIncome,
            storedExpenses,
            storedEmis,
            storedBudgets,
        ] =
            await Promise.all([
                getIncome(),
                getExpenses(),
                getEmis(),
                getBudgets(),
            ]);

        setIncome(
            storedIncome
        );

        setExpenses(
            storedExpenses
        );

        setEmis(
            storedEmis
        );

        setBudgets(
            storedBudgets
        );
    }


    useEffect(() => {
        loadData();
    }, []);


    const summary =
        useMemo(
            () =>
                calculateSummary(
                    income,
                    expenses,
                    emis,
                    budgets
                ),
            [
                income,
                expenses,
                emis,
                budgets,
            ]
        );


    const formatMoney =
        (value) =>
            Number(
                value || 0
            ).toFixed(2);


    /* =====================================================
       ADD MANUAL ENTRY
       ===================================================== */

    async function addItem() {
        const numericAmount =
            Number(
                amount
            );

        if (
            !title.trim() ||
            Number.isNaN(
                numericAmount
            ) ||
            numericAmount <=
                0
        ) {
            Alert.alert(
                "Invalid details",
                "Enter a name and valid amount."
            );

            return;
        }

        const now =
            new Date()
                .toISOString();

        const item = {
            title:
                title.trim(),

            amount:
                numericAmount,

            date:
                now,

            createdAt:
                now,

            source:
                "MANUAL",
        };

        if (
            type ===
            "income"
        ) {
            await saveIncome({
                ...item,

                category:
                    title.trim(),
            });
        }

        if (
            type ===
            "expense"
        ) {
            await saveExpense({
                ...item,

                category:
                    selectedCategory,
            });
        }

        if (
            type ===
            "emi"
        ) {
            await saveEmi({
                ...item,

                category:
                    "EMI",
            });
        }

        setTitle("");
        setAmount("");

        await loadData();
    }


    /* =====================================================
       SAVE BUDGET
       ===================================================== */

    async function saveBudget() {
        const numericBudget =
            Number(
                budgetAmount
            );

        if (
            Number.isNaN(
                numericBudget
            ) ||
            numericBudget <=
                0
        ) {
            Alert.alert(
                "Invalid budget",
                "Enter a valid budget amount."
            );

            return;
        }

        const updated = {
            ...budgets,

            [budgetCategory]:
                numericBudget,
        };

        setBudgets(
            updated
        );

        await saveBudgets(
            updated
        );

        setBudgetAmount(
            ""
        );

        Alert.alert(
            "Budget saved",
            `${budgetCategory} budget set to ₹${formatMoney(
                numericBudget
            )}.`
        );
    }


    /* =====================================================
       SYNC BPAY
       ===================================================== */

    const syncWithBPay =
    async () => {
        try {
            setIsSyncing(true);

            setSyncMessage(
                "Connecting to BPay..."
            );

            console.log(
                "Starting BPay sync..."
            );


            /* =========================================
               LOAD INCOME FROM BPAY BACKEND
               ========================================= */

            const incomeResponse =
                await fetch(
                    `${API_BASE_URL}/api/incomes`
                );

            console.log(
                "Income API status:",
                incomeResponse.status
            );

            let backendIncome;

            try {
                backendIncome =
                    await incomeResponse.json();
            } catch {
                throw new Error(
                    "Income API returned an invalid response."
                );
            }

            console.log(
                "Income received:",
                backendIncome
            );

            if (
                !incomeResponse.ok
            ) {
                throw new Error(
                    backendIncome?.message ||
                        "Unable to load BPay income."
                );
            }


            setSyncMessage(
                "Income loaded. Loading payments..."
            );


            /* =========================================
               LOAD PAYMENTS FROM BPAY BACKEND
               ========================================= */

            const paymentResponse =
                await fetch(
                    `${API_BASE_URL}/api/payments`
                );

            console.log(
                "Payments API status:",
                paymentResponse.status
            );

            let backendPayments;

            try {
                backendPayments =
                    await paymentResponse.json();
            } catch {
                throw new Error(
                    "Payments API returned an invalid response."
                );
            }

            console.log(
                "Payments received:",
                backendPayments
            );

            if (
                !paymentResponse.ok
            ) {
                throw new Error(
                    backendPayments?.message ||
                        "Unable to load BPay payments."
                );
            }


            setSyncMessage(
                "BPay data loaded. Importing transactions..."
            );


            /* =========================================
               MERGE INCOME
               ========================================= */

            const localIncome =
                await getIncome();

            const mergedIncome = [
                ...localIncome,
            ];

            let addedIncomeCount =
                0;


            if (
                Array.isArray(
                    backendIncome
                )
            ) {
                backendIncome.forEach(
                    (
                        incomeItem
                    ) => {
                        if (
                            !incomeItem ||
                            !incomeItem.incomeId
                        ) {
                            return;
                        }


                        const exists =
                            mergedIncome.some(
                                (
                                    localItem
                                ) =>
                                    localItem.incomeId ===
                                    incomeItem.incomeId
                            );


                        if (
                            exists
                        ) {
                            return;
                        }


                        mergedIncome.unshift({
                            id:
                                incomeItem.incomeId,

                            incomeId:
                                incomeItem.incomeId,

                            title:
                                incomeItem.category ||
                                "Income",

                            category:
                                incomeItem.category ||
                                "Other",

                            amount:
                                Number(
                                    incomeItem.amount ||
                                        0
                                ),

                            source:
                                incomeItem.source ||
                                "BPAY_WALLET",

                            date:
                                incomeItem.date ||
                                incomeItem.createdAt,

                            createdAt:
                                incomeItem.createdAt ||
                                incomeItem.date,
                        });


                        addedIncomeCount++;
                    }
                );
            }


            /* =========================================
               LOAD LOCAL EXPENSES
               ========================================= */

            const localExpenses =
                await getExpenses();

            const mergedExpenses = [
                ...localExpenses,
            ];

            let addedExpenseCount =
                0;


            /* =========================================
               ONLY IMPORT PAID PAYMENTS
               ========================================= */

            const paidPayments =
                Array.isArray(
                    backendPayments
                )
                    ? backendPayments.filter(
                          (
                              payment
                          ) =>
                              payment?.status ===
                              "PAID"
                      )
                    : [];


            console.log(
                "Paid payments:",
                paidPayments
            );


            /* =========================================
               PROCESS EACH PAYMENT
               ========================================= */

            paidPayments.forEach(
                (
                    payment
                ) => {
                    if (
                        !payment?.paymentId
                    ) {
                        return;
                    }


                    const products =
                        payment.invoice
                            ?.products ||
                        [];


                    /*
                     * Categorized product bill.
                     */
                    if (
                        Array.isArray(
                            products
                        ) &&
                        products.length >
                            0
                    ) {
                        const categoryTotals =
                            {};


                        products.forEach(
                            (
                                product
                            ) => {
                                const category =
                                    product?.category ||
                                    "Other";


                                const productAmount =
                                    Number(
                                        product?.total ??
                                            product?.netAmount ??
                                            0
                                    );


                                if (
                                    Number.isNaN(
                                        productAmount
                                    )
                                ) {
                                    return;
                                }


                                categoryTotals[
                                    category
                                ] =
                                    (
                                        categoryTotals[
                                            category
                                        ] ||
                                        0
                                    ) +
                                    productAmount;
                            }
                        );


                        Object.entries(
                            categoryTotals
                        ).forEach(
                            ([
                                category,
                                categoryAmount,
                            ]) => {
                                const uniqueId =
                                    `${payment.paymentId}-${category}`;


                                const exists =
                                    mergedExpenses.some(
                                        (
                                            expense
                                        ) =>
                                            expense.id ===
                                                uniqueId ||
                                            (
                                                expense.paymentId ===
                                                    payment.paymentId &&
                                                expense.category ===
                                                    category
                                            )
                                    );


                                if (
                                    exists
                                ) {
                                    return;
                                }


                                mergedExpenses.unshift({
                                    id:
                                        uniqueId,

                                    paymentId:
                                        payment.paymentId,

                                    invoiceNumber:
                                        payment.invoice
                                            ?.invoiceNumber ||
                                        "",

                                    title:
                                        payment.merchant
                                            ?.merchantName ||
                                        "BPay Purchase",

                                    amount:
                                        Number(
                                            categoryAmount
                                        ),

                                    category,

                                    source:
                                        "BPAY",

                                    date:
                                        payment.paidAt ||
                                        payment.createdAt ||
                                        new Date()
                                            .toISOString(),

                                    createdAt:
                                        payment.paidAt ||
                                        payment.createdAt ||
                                        new Date()
                                            .toISOString(),
                                });


                                addedExpenseCount++;
                            }
                        );


                        return;
                    }


                    /*
                     * OLD PAYMENT SUPPORT
                     */

                    const exists =
                        mergedExpenses.some(
                            (
                                expense
                            ) =>
                                expense.paymentId ===
                                payment.paymentId
                        );


                    if (
                        exists
                    ) {
                        return;
                    }


                    mergedExpenses.unshift({
                        id:
                            payment.paymentId,

                        paymentId:
                            payment.paymentId,

                        invoiceNumber:
                            payment.invoice
                                ?.invoiceNumber ||
                            "",

                        title:
                            payment.merchant
                                ?.merchantName ||
                            "BPay Purchase",

                        amount:
                            Number(
                                payment.amount ||
                                    0
                            ),

                        category:
                            payment.invoice
                                ?.expenseCategory ||
                            "Other",

                        source:
                            "BPAY",

                        date:
                            payment.paidAt ||
                            payment.createdAt ||
                            new Date()
                                .toISOString(),

                        createdAt:
                            payment.paidAt ||
                            payment.createdAt ||
                            new Date()
                                .toISOString(),
                    });


                    addedExpenseCount++;
                }
            );


            /* =========================================
               SAVE IMPORTED DATA
               ========================================= */

            await replaceIncome(
                mergedIncome
            );

            await replaceExpenses(
                mergedExpenses
            );

            await loadData();


            /* =========================================
               SUCCESS MESSAGE
               ========================================= */

            const incomeWord =
                addedIncomeCount ===
                1
                    ? "income entry"
                    : "income entries";


            const expenseWord =
                addedExpenseCount ===
                1
                    ? "expense entry"
                    : "expense entries";


            const message =
                `Sync complete. ${addedIncomeCount} ${incomeWord} and ${addedExpenseCount} ${expenseWord} added.`;


            console.log(
                message
            );

            setSyncMessage(
                message
            );

        } catch (
            error
        ) {
            console.error(
                "BPay sync error:",
                error
            );


            setSyncMessage(
                `Sync failed: ${
                    error?.message ||
                    "Unable to connect to BPay."
                }`
            );

        } finally {
            setIsSyncing(
                false
            );
        }
    };


    return (
        <SafeAreaView
            style={
                styles.container
            }
        >
            <View
                style={
                    styles.header
                }
            >
                <View>
                    <Text
                        style={
                            styles.brand
                        }
                    >
                        BPay Expense
                    </Text>

                    <Text
                        style={
                            styles.brandSub
                        }
                    >
                        PERSONAL FINANCE
                    </Text>
                </View>
            </View>


            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
                {screen ===
                    "home" && (
                    <>
                        <Text
                            style={
                                styles.pageTitle
                            }
                        >
                            This Month
                        </Text>


                        <View
                            style={
                                styles.balanceCard
                            }
                        >
                            <Text
                                style={
                                    styles.balanceLabel
                                }
                            >
                                Remaining Balance
                            </Text>

                            <Text
                                style={
                                    styles.balance
                                }
                            >
                                ₹
                                {formatMoney(
                                    summary.remaining
                                )}
                            </Text>

                            <View
                                style={
                                    styles.balanceDivider
                                }
                            />

                            <SummaryRow
                                label="Income"
                                value={`₹${formatMoney(
                                    summary.totalIncome
                                )}`}
                            />

                            <SummaryRow
                                label="Expenses"
                                value={`₹${formatMoney(
                                    summary.totalExpense
                                )}`}
                            />

                            <SummaryRow
                                label="EMIs"
                                value={`₹${formatMoney(
                                    summary.totalEmi
                                )}`}
                            />
                        </View>


                        <TouchableOpacity
                            style={
                                styles.syncButton
                            }
                            onPress={
                                syncWithBPay
                            }
                            disabled={
                                isSyncing
                            }
                        >
                            <Text
                                style={
                                    styles.syncButtonText
                                }
                            >
                                {isSyncing
                                    ? "Syncing..."
                                    : "Sync with BPay"}
                            </Text>
                        </TouchableOpacity>


                        {syncMessage ? (
                            <View
                                style={
                                    styles.syncMessageBox
                                }
                            >
                                <Text
                                    style={
                                        styles.syncMessage
                                    }
                                >
                                    {
                                        syncMessage
                                    }
                                </Text>
                            </View>
                        ) : null}


                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Savings Plan
                        </Text>


                        <View
                            style={
                                styles.whiteCard
                            }
                        >
                            <SummaryRow
                                label="Suggested Savings"
                                value={`₹${formatMoney(
                                    summary.suggestedSavings
                                )}`}
                                accent
                            />

                            <SummaryRow
                                label="Safe to Spend"
                                value={`₹${formatMoney(
                                    summary.safeToSpend
                                )}`}
                            />
                        </View>


                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Income Sources
                        </Text>


                        <View
                            style={
                                styles.whiteCard
                            }
                        >
                            {income.length ===
                            0 ? (
                                <Text
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    No income recorded.
                                </Text>
                            ) : (
                                income
                                    .slice(
                                        0,
                                        6
                                    )
                                    .map(
                                        (
                                            item
                                        ) => (
                                            <SummaryRow
                                                key={
                                                    item.id
                                                }
                                                label={
                                                    item.category ||
                                                    item.title
                                                }
                                                value={`+₹${formatMoney(
                                                    item.amount
                                                )}`}
                                            />
                                        )
                                    )
                            )}
                        </View>


                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Category Spending
                        </Text>


                        <View
                            style={
                                styles.whiteCard
                            }
                        >
                            {Object.keys(
                                summary.categoryTotals
                            ).length ===
                            0 ? (
                                <Text
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    No expenses this month.
                                </Text>
                            ) : (
                                Object.entries(
                                    summary.categoryTotals
                                ).map(
                                    ([
                                        category,
                                        value,
                                    ]) => (
                                        <SummaryRow
                                            key={
                                                category
                                            }
                                            label={
                                                category
                                            }
                                            value={`₹${formatMoney(
                                                value
                                            )}`}
                                        />
                                    )
                                )
                            )}
                        </View>


                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Budget Status
                        </Text>


                        {summary
                            .categoryBudgetStatus
                            .length ===
                        0 ? (
                            <View
                                style={
                                    styles.whiteCard
                                }
                            >
                                <Text
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    No category budgets set.
                                </Text>
                            </View>
                        ) : (
                            summary.categoryBudgetStatus.map(
                                (
                                    item
                                ) => (
                                    <View
                                        key={
                                            item.category
                                        }
                                        style={
                                            styles.budgetCard
                                        }
                                    >
                                        <View
                                            style={
                                                styles.budgetTop
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.budgetTitle
                                                }
                                            >
                                                {
                                                    item.category
                                                }
                                            </Text>

                                            <Text
                                                style={[
                                                    styles.budgetValue,

                                                    item.exceeded &&
                                                        styles.budgetExceeded,
                                                ]}
                                            >
                                                ₹
                                                {formatMoney(
                                                    item.spent
                                                )}
                                                {" / "}
                                                ₹
                                                {formatMoney(
                                                    item.budget
                                                )}
                                            </Text>
                                        </View>


                                        <View
                                            style={
                                                styles.progressBackground
                                            }
                                        >
                                            <View
                                                style={[
                                                    styles.progressFill,

                                                    {
                                                        width:
                                                            `${Math.min(
                                                                item.percentage,
                                                                100
                                                            )}%`,
                                                    },

                                                    item.exceeded &&
                                                        styles.progressExceeded,
                                                ]}
                                            />
                                        </View>


                                        <Text
                                            style={
                                                styles.budgetInfo
                                            }
                                        >
                                            {item.exceeded
                                                ? `Over budget by ₹${formatMoney(
                                                      Math.abs(
                                                          item.remainingBudget
                                                      )
                                                  )}`
                                                : `₹${formatMoney(
                                                      item.remainingBudget
                                                  )} remaining`}
                                        </Text>
                                    </View>
                                )
                            )
                        )}
                    </>
                )}


                {screen ===
                    "add" && (
                    <>
                        <Text
                            style={
                                styles.pageTitle
                            }
                        >
                            Add Entry
                        </Text>


                        <View
                            style={
                                styles.whiteCard
                            }
                        >
                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Entry Type
                            </Text>


                            <View
                                style={
                                    styles.typeRow
                                }
                            >
                                {[
                                    "income",
                                    "expense",
                                    "emi",
                                ].map(
                                    (
                                        item
                                    ) => (
                                        <TouchableOpacity
                                            key={
                                                item
                                            }
                                            style={[
                                                styles.typeButton,

                                                type ===
                                                    item &&
                                                    styles.typeButtonActive,
                                            ]}
                                            onPress={() =>
                                                setType(
                                                    item
                                                )
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.typeText,

                                                    type ===
                                                        item &&
                                                        styles.typeTextActive,
                                                ]}
                                            >
                                                {item.toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                )}
                            </View>


                            <TextInput
                                style={
                                    styles.input
                                }
                                placeholder={
                                    type ===
                                    "income"
                                        ? "Income source"
                                        : "Name"
                                }
                                placeholderTextColor="#9ca3af"
                                value={
                                    title
                                }
                                onChangeText={
                                    setTitle
                                }
                            />


                            <TextInput
                                style={
                                    styles.input
                                }
                                placeholder="Amount"
                                placeholderTextColor="#9ca3af"
                                value={
                                    amount
                                }
                                onChangeText={
                                    setAmount
                                }
                                keyboardType="numeric"
                            />


                            {type ===
                                "expense" && (
                                <>
                                    <Text
                                        style={
                                            styles.label
                                        }
                                    >
                                        Category
                                    </Text>


                                    <View
                                        style={
                                            styles.chipContainer
                                        }
                                    >
                                        {CATEGORIES.map(
                                            (
                                                category
                                            ) => (
                                                <TouchableOpacity
                                                    key={
                                                        category
                                                    }
                                                    style={[
                                                        styles.chip,

                                                        selectedCategory ===
                                                            category &&
                                                            styles.chipActive,
                                                    ]}
                                                    onPress={() =>
                                                        setSelectedCategory(
                                                            category
                                                        )
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.chipText,

                                                            selectedCategory ===
                                                                category &&
                                                                styles.chipTextActive,
                                                        ]}
                                                    >
                                                        {
                                                            category
                                                        }
                                                    </Text>
                                                </TouchableOpacity>
                                            )
                                        )}
                                    </View>
                                </>
                            )}


                            <TouchableOpacity
                                style={
                                    styles.primaryButton
                                }
                                onPress={
                                    addItem
                                }
                            >
                                <Text
                                    style={
                                        styles.primaryButtonText
                                    }
                                >
                                    Add Entry
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}


                {screen ===
                    "budgets" && (
                    <>
                        <Text
                            style={
                                styles.pageTitle
                            }
                        >
                            Monthly Budgets
                        </Text>


                        <View
                            style={
                                styles.whiteCard
                            }
                        >
                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Category
                            </Text>


                            <View
                                style={
                                    styles.chipContainer
                                }
                            >
                                {CATEGORIES.filter(
                                    (
                                        item
                                    ) =>
                                        item !==
                                        "EMI"
                                ).map(
                                    (
                                        category
                                    ) => (
                                        <TouchableOpacity
                                            key={
                                                category
                                            }
                                            style={[
                                                styles.chip,

                                                budgetCategory ===
                                                    category &&
                                                    styles.chipActive,
                                            ]}
                                            onPress={() =>
                                                setBudgetCategory(
                                                    category
                                                )
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,

                                                    budgetCategory ===
                                                        category &&
                                                        styles.chipTextActive,
                                                ]}
                                            >
                                                {
                                                    category
                                                }
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                )}
                            </View>


                            <TextInput
                                style={
                                    styles.input
                                }
                                placeholder="Monthly budget amount"
                                placeholderTextColor="#9ca3af"
                                value={
                                    budgetAmount
                                }
                                onChangeText={
                                    setBudgetAmount
                                }
                                keyboardType="numeric"
                            />


                            <TouchableOpacity
                                style={
                                    styles.primaryButton
                                }
                                onPress={
                                    saveBudget
                                }
                            >
                                <Text
                                    style={
                                        styles.primaryButtonText
                                    }
                                >
                                    Save Budget
                                </Text>
                            </TouchableOpacity>
                        </View>


                        {Object.entries(
                            budgets
                        ).map(
                            ([
                                category,
                                value,
                            ]) => (
                                <View
                                    key={
                                        category
                                    }
                                    style={
                                        styles.listCard
                                    }
                                >
                                    <Text
                                        style={
                                            styles.listTitle
                                        }
                                    >
                                        {
                                            category
                                        }
                                    </Text>

                                    <Text
                                        style={
                                            styles.listAmount
                                        }
                                    >
                                        ₹
                                        {formatMoney(
                                            value
                                        )}
                                    </Text>
                                </View>
                            )
                        )}
                    </>
                )}
            </ScrollView>


            <View
                style={
                    styles.bottomNav
                }
            >
                <NavButton
                    label="Home"
                    active={
                        screen ===
                        "home"
                    }
                    onPress={() =>
                        setScreen(
                            "home"
                        )
                    }
                />

                <NavButton
                    label="Add"
                    active={
                        screen ===
                        "add"
                    }
                    onPress={() =>
                        setScreen(
                            "add"
                        )
                    }
                />

                <NavButton
                    label="Budgets"
                    active={
                        screen ===
                        "budgets"
                    }
                    onPress={() =>
                        setScreen(
                            "budgets"
                        )
                    }
                />
            </View>
        </SafeAreaView>
    );
}


/* =========================================================
   SUMMARY ROW
   ========================================================= */

function SummaryRow({
    label,
    value,
    accent,
}) {
    return (
        <View
            style={
                styles.summaryRow
            }
        >
            <Text
                style={
                    styles.summaryLabel
                }
            >
                {label}
            </Text>

            <Text
                style={[
                    styles.summaryValue,

                    accent &&
                        styles.summaryAccent,
                ]}
            >
                {value}
            </Text>
        </View>
    );
}


/* =========================================================
   NAV BUTTON
   ========================================================= */

function NavButton({
    label,
    active,
    onPress,
}) {
    return (
        <TouchableOpacity
            style={
                styles.navButton
            }
            onPress={
                onPress
            }
        >
            <Text
                style={[
                    styles.navText,

                    active &&
                        styles.navActive,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}


/* =========================================================
   STYLES
   ========================================================= */

const styles =
    StyleSheet.create({
        container: {
            flex: 1,

            backgroundColor:
                "#f5f5f6",
        },


        header: {
            paddingHorizontal:
                20,

            paddingTop: 17,

            paddingBottom:
                13,

            borderBottomWidth:
                1,

            borderBottomColor:
                "#eeeeee",

            backgroundColor:
                "#ffffff",
        },


        brand: {
            color:
                "#18181b",

            fontSize: 23,

            fontWeight:
                "900",
        },


        brandSub: {
            marginTop: 2,

            color:
                "#dc2626",

            fontSize: 9,

            fontWeight:
                "900",

            letterSpacing:
                1.3,
        },


        content: {
            padding: 20,

            paddingBottom:
                110,
        },


        pageTitle: {
            marginBottom:
                16,

            color:
                "#18181b",

            fontSize: 25,

            fontWeight:
                "900",
        },


        sectionTitle: {
            marginTop: 8,

            marginBottom:
                9,

            color:
                "#18181b",

            fontSize: 16,

            fontWeight:
                "900",
        },


        balanceCard: {
            marginBottom:
                18,

            padding: 22,

            borderRadius:
                17,

            backgroundColor:
                "#111111",
        },


        balanceLabel: {
            color:
                "#a1a1aa",

            fontSize: 11,
        },


        balance: {
            marginTop: 6,

            color:
                "#ffffff",

            fontSize: 35,

            fontWeight:
                "900",
        },


        balanceDivider: {
            marginVertical:
                16,

            height: 1,

            backgroundColor:
                "#303033",
        },


        syncButton: {
            marginBottom:
                12,

            paddingVertical:
                14,

            alignItems:
                "center",

            borderWidth: 1,

            borderColor:
                "#fecaca",

            borderRadius:
                11,

            backgroundColor:
                "#fff1f2",
        },


        syncButtonText: {
            color:
                "#dc2626",

            fontSize: 13,

            fontWeight:
                "900",
        },


        syncMessageBox: {
            marginBottom:
                20,

            paddingHorizontal:
                14,

            paddingVertical:
                10,

            borderWidth: 1,

            borderColor:
                "#eeeeee",

            borderRadius:
                10,

            backgroundColor:
                "#ffffff",
        },


        syncMessage: {
            color:
                "#71717a",

            fontSize: 11,

            lineHeight: 17,

            textAlign:
                "center",
        },


        whiteCard: {
            marginBottom:
                16,

            padding: 17,

            borderWidth: 1,

            borderColor:
                "#e5e5e5",

            borderRadius:
                13,

            backgroundColor:
                "#ffffff",
        },


        summaryRow: {
            paddingVertical:
                7,

            flexDirection:
                "row",

            justifyContent:
                "space-between",

            gap: 15,
        },


        summaryLabel: {
            flex: 1,

            color:
                "#71717a",

            fontSize: 12,
        },


        summaryValue: {
            color:
                "#18181b",

            fontSize: 13,

            fontWeight:
                "800",
        },


        summaryAccent: {
            color:
                "#dc2626",
        },


        emptyText: {
            color:
                "#8b8b93",

            fontSize: 12,
        },


        budgetCard: {
            marginBottom:
                10,

            padding: 15,

            borderWidth: 1,

            borderColor:
                "#e5e5e5",

            borderRadius:
                12,

            backgroundColor:
                "#ffffff",
        },


        budgetTop: {
            flexDirection:
                "row",

            justifyContent:
                "space-between",

            gap: 15,
        },


        budgetTitle: {
            color:
                "#18181b",

            fontSize: 13,

            fontWeight:
                "900",
        },


        budgetValue: {
            color:
                "#18181b",

            fontSize: 11,

            fontWeight:
                "800",
        },


        budgetExceeded: {
            color:
                "#dc2626",
        },


        progressBackground: {
            height: 7,

            marginTop: 12,

            overflow:
                "hidden",

            borderRadius:
                999,

            backgroundColor:
                "#eeeeee",
        },


        progressFill: {
            height:
                "100%",

            borderRadius:
                999,

            backgroundColor:
                "#18181b",
        },


        progressExceeded: {
            backgroundColor:
                "#dc2626",
        },


        budgetInfo: {
            marginTop: 7,

            color:
                "#8b8b93",

            fontSize: 10,
        },


        label: {
            marginBottom: 8,

            color:
                "#52525b",

            fontSize: 11,

            fontWeight:
                "800",
        },


        input: {
            marginBottom:
                12,

            paddingHorizontal:
                13,

            paddingVertical:
                12,

            borderWidth: 1,

            borderColor:
                "#e5e5e5",

            borderRadius:
                10,

            color:
                "#18181b",

            backgroundColor:
                "#fafafa",
        },


        typeRow: {
            marginBottom:
                14,

            flexDirection:
                "row",

            gap: 8,
        },


        typeButton: {
            flex: 1,

            paddingVertical:
                10,

            alignItems:
                "center",

            borderWidth: 1,

            borderColor:
                "#e5e5e5",

            borderRadius:
                9,

            backgroundColor:
                "#fafafa",
        },


        typeButtonActive: {
            borderColor:
                "#fecaca",

            backgroundColor:
                "#fff1f2",
        },


        typeText: {
            color:
                "#71717a",

            fontSize: 10,

            fontWeight:
                "900",
        },


        typeTextActive: {
            color:
                "#dc2626",
        },


        chipContainer: {
            marginBottom:
                14,

            flexDirection:
                "row",

            flexWrap:
                "wrap",

            gap: 7,
        },


        chip: {
            paddingHorizontal:
                11,

            paddingVertical:
                7,

            borderWidth: 1,

            borderColor:
                "#e5e5e5",

            borderRadius:
                999,

            backgroundColor:
                "#fafafa",
        },


        chipActive: {
            borderColor:
                "#fecaca",

            backgroundColor:
                "#fff1f2",
        },


        chipText: {
            color:
                "#71717a",

            fontSize: 10,

            fontWeight:
                "700",
        },


        chipTextActive: {
            color:
                "#dc2626",
        },


        primaryButton: {
            padding: 14,

            alignItems:
                "center",

            borderRadius:
                10,

            backgroundColor:
                "#dc2626",
        },


        primaryButtonText: {
            color:
                "#ffffff",

            fontSize: 13,

            fontWeight:
                "900",
        },


        listCard: {
            marginBottom: 9,

            padding: 15,

            flexDirection:
                "row",

            justifyContent:
                "space-between",

            borderWidth: 1,

            borderColor:
                "#e5e5e5",

            borderRadius:
                11,

            backgroundColor:
                "#ffffff",
        },


        listTitle: {
            color:
                "#18181b",

            fontWeight:
                "900",
        },


        listAmount: {
            color:
                "#dc2626",

            fontWeight:
                "900",
        },


        bottomNav: {
            position:
                "absolute",

            bottom: 0,

            left: 0,

            right: 0,

            height: 68,

            flexDirection:
                "row",

            borderTopWidth:
                1,

            borderTopColor:
                "#e5e5e5",

            backgroundColor:
                "#ffffff",
        },


        navButton: {
            flex: 1,

            alignItems:
                "center",

            justifyContent:
                "center",
        },


        navText: {
            color:
                "#8b8b93",

            fontSize: 11,

            fontWeight:
                "800",
        },


        navActive: {
            color:
                "#dc2626",
        },
    });
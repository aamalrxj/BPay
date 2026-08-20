import {
    useCallback,
    useState,
} from "react";

import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    useFocusEffect,
} from "@react-navigation/native";

import {
    addToWallet,
    getWalletBalance,
} from "../storage/walletStorage";


const API_BASE_URL =
    "http://localhost:5000";

const INCOME_HISTORY_KEY =
    "bpay_income_history";


const INCOME_CATEGORIES = [
    "Salary",
    "Incentive",
    "Freelance",
    "Business",
    "Allowance",
    "Refund",
    "Gift",
    "Other",
];


function AddBalanceScreen({
    navigation,
}) {
    const [
        balance,
        setBalance,
    ] = useState(0);

    const [
        amount,
        setAmount,
    ] = useState("");

    const [
        selectedCategory,
        setSelectedCategory,
    ] = useState(
        "Salary"
    );

    const [
        customCategory,
        setCustomCategory,
    ] = useState("");

    const [
        isLoading,
        setIsLoading,
    ] = useState(false);


    const formatMoney =
        (value) => {
            return new Intl.NumberFormat(
                "en-IN",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }
            ).format(
                Number(
                    value || 0
                )
            );
        };


    const getIncomeCategory =
        () => {
            if (
                selectedCategory ===
                "Other"
            ) {
                return (
                    customCategory.trim() ||
                    "Other"
                );
            }

            return selectedCategory;
        };


    const loadBalance =
        useCallback(
            async () => {
                const savedBalance =
                    await getWalletBalance();

                setBalance(
                    savedBalance
                );
            },
            []
        );


    /*
     * Retry locally stored income
     * records that could not reach
     * backend earlier.
     */
    const syncPendingIncome =
        useCallback(
            async () => {
                try {
                    const stored =
                        await AsyncStorage.getItem(
                            INCOME_HISTORY_KEY
                        );

                    if (!stored) {
                        return;
                    }

                    const records =
                        JSON.parse(
                            stored
                        );

                    if (
                        !Array.isArray(
                            records
                        )
                    ) {
                        return;
                    }

                    let changed =
                        false;

                    const updated = [
                        ...records,
                    ];

                    for (
                        let index = 0;
                        index <
                        updated.length;
                        index++
                    ) {
                        const item =
                            updated[
                                index
                            ];

                        if (
                            item.backendSynced
                        ) {
                            continue;
                        }

                        try {
                            const response =
                                await fetch(
                                    `${API_BASE_URL}/api/incomes`,
                                    {
                                        method:
                                            "POST",

                                        headers:
                                            {
                                                "Content-Type":
                                                    "application/json",
                                            },

                                        body:
                                            JSON.stringify(
                                                item
                                            ),
                                    }
                                );

                            if (
                                response.ok
                            ) {
                                updated[
                                    index
                                ] = {
                                    ...item,

                                    backendSynced:
                                        true,
                                };

                                changed =
                                    true;
                            }
                        } catch {
                            /*
                             * Backend may currently
                             * be offline.
                             */
                        }
                    }

                    if (changed) {
                        await AsyncStorage.setItem(
                            INCOME_HISTORY_KEY,
                            JSON.stringify(
                                updated
                            )
                        );
                    }
                } catch (error) {
                    console.error(
                        "Pending income sync error:",
                        error
                    );
                }
            },
            []
        );


    useFocusEffect(
        useCallback(() => {
            loadBalance();

            syncPendingIncome();
        }, [
            loadBalance,
            syncPendingIncome,
        ])
    );


    const saveIncomeRecord =
        async (
            numericAmount
        ) => {
            const now =
                new Date()
                    .toISOString();

            const incomeRecord = {
                incomeId:
                    `INC-${Date.now()}-${Math.random()
                        .toString(36)
                        .substring(
                            2,
                            7
                        )
                        .toUpperCase()}`,

                amount:
                    numericAmount,

                category:
                    getIncomeCategory(),

                source:
                    "BPAY_WALLET",

                date:
                    now,

                createdAt:
                    now,

                backendSynced:
                    false,
            };

            const stored =
                await AsyncStorage.getItem(
                    INCOME_HISTORY_KEY
                );

            let existing =
                [];

            try {
                existing =
                    stored
                        ? JSON.parse(
                              stored
                          )
                        : [];
            } catch {
                existing =
                    [];
            }

            if (
                !Array.isArray(
                    existing
                )
            ) {
                existing =
                    [];
            }

            const updated = [
                incomeRecord,
                ...existing,
            ];

            /*
             * First save locally so the
             * income isn't lost if backend
             * is temporarily unavailable.
             */
            await AsyncStorage.setItem(
                INCOME_HISTORY_KEY,
                JSON.stringify(
                    updated
                )
            );

            try {
                const response =
                    await fetch(
                        `${API_BASE_URL}/api/incomes`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify(
                                    incomeRecord
                                ),
                        }
                    );

                if (
                    response.ok
                ) {
                    incomeRecord.backendSynced =
                        true;

                    updated[0] =
                        incomeRecord;

                    await AsyncStorage.setItem(
                        INCOME_HISTORY_KEY,
                        JSON.stringify(
                            updated
                        )
                    );
                }
            } catch (
                error
            ) {
                console.warn(
                    "Income stored locally. Backend sync will retry later.",
                    error
                );
            }

            return incomeRecord;
        };


    const handleAddBalance =
        async () => {
            const numericAmount =
                Number(
                    amount
                );

            if (
                !amount.trim()
            ) {
                Alert.alert(
                    "Enter amount",
                    "Please enter the amount you want to add."
                );

                return;
            }

            if (
                Number.isNaN(
                    numericAmount
                ) ||
                numericAmount <=
                    0
            ) {
                Alert.alert(
                    "Invalid amount",
                    "Enter an amount greater than zero."
                );

                return;
            }

            if (
                numericAmount >
                100000
            ) {
                Alert.alert(
                    "Amount too high",
                    "For this demo, you can add a maximum of ₹1,00,000 at once."
                );

                return;
            }

            if (
                selectedCategory ===
                    "Other" &&
                !customCategory.trim()
            ) {
                Alert.alert(
                    "Enter income type",
                    "Please enter where this money came from."
                );

                return;
            }

            try {
                setIsLoading(
                    true
                );

                const updatedBalance =
                    await addToWallet(
                        numericAmount
                    );

                const incomeRecord =
                    await saveIncomeRecord(
                        numericAmount
                    );

                setBalance(
                    updatedBalance
                );

                setAmount("");

                setSelectedCategory(
                    "Salary"
                );

                setCustomCategory(
                    ""
                );

                Alert.alert(
                    "Money added",
                    `₹${formatMoney(
                        numericAmount
                    )} was added as ${incomeRecord.category}.`,
                    [
                        {
                            text:
                                "Stay here",
                        },

                        {
                            text:
                                "Go Home",

                            onPress:
                                () =>
                                    navigation.navigate(
                                        "Home"
                                    ),
                        },
                    ]
                );
            } catch (error) {
                console.error(
                    error
                );

                Alert.alert(
                    "Unable to add money",
                    "Something went wrong while updating the wallet."
                );
            } finally {
                setIsLoading(
                    false
                );
            }
        };


    const selectQuickAmount =
        (value) => {
            setAmount(
                value.toString()
            );
        };


    return (
        <SafeAreaView
            style={
                styles.container
            }
        >
            <KeyboardAvoidingView
                style={
                    styles.keyboardView
                }
                behavior={
                    Platform.OS ===
                    "ios"
                        ? "padding"
                        : undefined
                }
            >
                <ScrollView
                    contentContainerStyle={
                        styles.content
                    }
                    showsVerticalScrollIndicator={
                        false
                    }
                    keyboardShouldPersistTaps="handled"
                >
                    <Text
                        style={
                            styles.smallTitle
                        }
                    >
                        WALLET BALANCE
                    </Text>

                    <Text
                        style={
                            styles.balance
                        }
                    >
                        ₹
                        {formatMoney(
                            balance
                        )}
                    </Text>


                    <View
                        style={
                            styles.card
                        }
                    >
                        <Text
                            style={
                                styles.title
                            }
                        >
                            Add Money
                        </Text>

                        <Text
                            style={
                                styles.description
                            }
                        >
                            Add money to your
                            wallet and select
                            where the money came
                            from.
                        </Text>


                        <Text
                            style={
                                styles.fieldTitle
                            }
                        >
                            Income Type
                        </Text>

                        <View
                            style={
                                styles.categoryContainer
                            }
                        >
                            {INCOME_CATEGORIES.map(
                                (
                                    category
                                ) => (
                                    <TouchableOpacity
                                        key={
                                            category
                                        }
                                        style={[
                                            styles.categoryButton,

                                            selectedCategory ===
                                                category &&
                                                styles.categoryButtonActive,
                                        ]}
                                        onPress={() =>
                                            setSelectedCategory(
                                                category
                                            )
                                        }
                                        disabled={
                                            isLoading
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.categoryButtonText,

                                                selectedCategory ===
                                                    category &&
                                                    styles.categoryButtonTextActive,
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


                        {selectedCategory ===
                            "Other" && (
                            <TextInput
                                style={
                                    styles.customInput
                                }
                                value={
                                    customCategory
                                }
                                onChangeText={
                                    setCustomCategory
                                }
                                placeholder="Eg. Rental income"
                                placeholderTextColor="#9ca3af"
                            />
                        )}


                        <Text
                            style={
                                styles.fieldTitle
                            }
                        >
                            Amount
                        </Text>

                        <View
                            style={
                                styles.amountInputContainer
                            }
                        >
                            <Text
                                style={
                                    styles.currencySymbol
                                }
                            >
                                ₹
                            </Text>

                            <TextInput
                                style={
                                    styles.amountInput
                                }
                                value={
                                    amount
                                }
                                onChangeText={
                                    setAmount
                                }
                                keyboardType="decimal-pad"
                                placeholder="0"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>


                        <Text
                            style={
                                styles.quickTitle
                            }
                        >
                            Quick amounts
                        </Text>

                        <View
                            style={
                                styles.quickAmounts
                            }
                        >
                            {[
                                500,
                                1000,
                                2000,
                                5000,
                            ].map(
                                (
                                    value
                                ) => (
                                    <TouchableOpacity
                                        key={
                                            value
                                        }
                                        style={
                                            styles.quickButton
                                        }
                                        onPress={() =>
                                            selectQuickAmount(
                                                value
                                            )
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.quickButtonText
                                            }
                                        >
                                            ₹
                                            {
                                                value
                                            }
                                        </Text>
                                    </TouchableOpacity>
                                )
                            )}
                        </View>


                        <View
                            style={
                                styles.summaryBox
                            }
                        >
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
                                    Income Type
                                </Text>

                                <Text
                                    style={
                                        styles.summaryValue
                                    }
                                >
                                    {getIncomeCategory()}
                                </Text>
                            </View>

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
                                    Amount
                                </Text>

                                <Text
                                    style={
                                        styles.summaryAmount
                                    }
                                >
                                    ₹
                                    {formatMoney(
                                        amount
                                    )}
                                </Text>
                            </View>
                        </View>


                        <TouchableOpacity
                            style={[
                                styles.addButton,

                                isLoading &&
                                    styles.disabledButton,
                            ]}
                            onPress={
                                handleAddBalance
                            }
                            disabled={
                                isLoading
                            }
                        >
                            <Text
                                style={
                                    styles.addButtonText
                                }
                            >
                                {isLoading
                                    ? "Adding..."
                                    : "Add Money"}
                            </Text>
                        </TouchableOpacity>


                        <Text
                            style={
                                styles.demoMessage
                            }
                        >
                            This is a demo
                            wallet. Income
                            details are also
                            shared with BPay
                            Expense when the
                            backend is available.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}


export default AddBalanceScreen;


const styles =
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor:
                "#f6f6f7",
        },

        keyboardView: {
            flex: 1,
        },

        content: {
            flexGrow: 1,
            width: "100%",
            maxWidth: 560,
            alignSelf:
                "center",
            paddingHorizontal:
                22,
            paddingTop: 24,
            paddingBottom:
                45,
        },

        smallTitle: {
            marginTop: 10,
            color: "#71717a",
            fontSize: 11,
            fontWeight:
                "800",
            letterSpacing:
                1.5,
        },

        balance: {
            marginTop: 6,
            marginBottom:
                28,
            color: "#dc2626",
            fontSize: 40,
            fontWeight:
                "900",
        },

        card: {
            padding: 24,
            borderWidth: 1,
            borderColor:
                "#e5e5e5",
            borderRadius:
                18,
            backgroundColor:
                "#ffffff",
        },

        title: {
            color: "#18181b",
            fontSize: 24,
            fontWeight:
                "900",
        },

        description: {
            marginTop: 7,
            marginBottom:
                24,
            color: "#71717a",
            fontSize: 14,
            lineHeight: 21,
        },

        fieldTitle: {
            marginBottom:
                10,
            color: "#3f3f46",
            fontSize: 13,
            fontWeight:
                "800",
        },

        categoryContainer: {
            marginBottom:
                20,
            flexDirection:
                "row",
            flexWrap:
                "wrap",
            gap: 8,
        },

        categoryButton: {
            paddingHorizontal:
                14,
            paddingVertical:
                9,
            borderWidth: 1,
            borderColor:
                "#e5e5e5",
            borderRadius:
                999,
            backgroundColor:
                "#fafafa",
        },

        categoryButtonActive: {
            borderColor:
                "#fecaca",
            backgroundColor:
                "#fff1f2",
        },

        categoryButtonText: {
            color: "#71717a",
            fontSize: 12,
            fontWeight:
                "800",
        },

        categoryButtonTextActive: {
            color: "#dc2626",
        },

        customInput: {
            marginBottom:
                20,
            padding: 13,
            borderWidth: 1,
            borderColor:
                "#e5e5e5",
            borderRadius:
                10,
            color: "#18181b",
            backgroundColor:
                "#fafafa",
        },

        amountInputContainer: {
            minHeight: 68,
            paddingHorizontal:
                16,
            flexDirection:
                "row",
            alignItems:
                "center",
            borderWidth: 1,
            borderColor:
                "#fecaca",
            borderRadius:
                14,
            backgroundColor:
                "#fffafa",
        },

        currencySymbol: {
            marginRight: 10,
            color: "#dc2626",
            fontSize: 28,
            fontWeight:
                "900",
        },

        amountInput: {
            flex: 1,
            paddingVertical:
                16,
            color: "#18181b",
            fontSize: 29,
            fontWeight:
                "800",
        },

        quickTitle: {
            marginTop: 24,
            marginBottom:
                11,
            color: "#3f3f46",
            fontSize: 13,
            fontWeight:
                "800",
        },

        quickAmounts: {
            flexDirection:
                "row",
            flexWrap:
                "wrap",
            gap: 9,
        },

        quickButton: {
            paddingHorizontal:
                15,
            paddingVertical:
                10,
            borderWidth: 1,
            borderColor:
                "#fecaca",
            borderRadius:
                999,
            backgroundColor:
                "#fff5f5",
        },

        quickButtonText: {
            color: "#dc2626",
            fontSize: 13,
            fontWeight:
                "800",
        },

        summaryBox: {
            marginTop: 24,
            padding: 15,
            borderWidth: 1,
            borderColor:
                "#eeeeee",
            borderRadius:
                12,
            backgroundColor:
                "#fafafa",
        },

        summaryRow: {
            paddingVertical:
                6,
            flexDirection:
                "row",
            justifyContent:
                "space-between",
        },

        summaryLabel: {
            color: "#71717a",
            fontSize: 11,
        },

        summaryValue: {
            color: "#18181b",
            fontSize: 12,
            fontWeight:
                "800",
        },

        summaryAmount: {
            color: "#dc2626",
            fontSize: 14,
            fontWeight:
                "900",
        },

        addButton: {
            marginTop: 24,
            minHeight: 52,
            alignItems:
                "center",
            justifyContent:
                "center",
            borderRadius:
                12,
            backgroundColor:
                "#dc2626",
        },

        disabledButton: {
            opacity: 0.45,
        },

        addButtonText: {
            color: "#ffffff",
            fontSize: 16,
            fontWeight:
                "900",
        },

        demoMessage: {
            marginTop: 16,
            color: "#a1a1aa",
            fontSize: 11,
            lineHeight: 17,
            textAlign:
                "center",
        },
    });
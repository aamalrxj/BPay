import { useCallback, useState } from "react";

import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import { getWalletBalance } from "../storage/walletStorage";

function HomeScreen({ navigation }) {
    const [balance, setBalance] = useState(0);

    const loadBalance = useCallback(async () => {
        const savedBalance = await getWalletBalance();

        setBalance(savedBalance);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadBalance();
        }, [loadBalance])
    );

    const formatMoney = (value) => {
        return new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>
                    BillPay
                </Text>

                <Text style={styles.welcome}>
                    Hello 👋
                </Text>

                <View style={styles.balanceCard}>
                    <Text style={styles.balanceTitle}>
                        Current Balance
                    </Text>

                    <Text style={styles.balance}>
                        ₹{formatMoney(balance)}
                    </Text>

                    <TouchableOpacity
                        style={styles.smallAddButton}
                        onPress={() =>
                            navigation.navigate("Add Balance")
                        }
                    >
                        <Text style={styles.smallAddButtonText}>
                            + Add Money
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>
                    Quick Actions
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                        navigation.navigate("Scan")
                    }
                >
                    <View style={styles.actionIcon}>
                        <Text style={styles.actionIconText}>
                            QR
                        </Text>
                    </View>

                    <View style={styles.actionTextContainer}>
                        <Text style={styles.buttonText}>
                            Scan & Pay
                        </Text>

                        <Text style={styles.buttonDescription}>
                            Scan or upload a shop QR
                        </Text>
                    </View>

                    <Text style={styles.arrow}>
                        ›
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                        navigation.navigate("Add Balance")
                    }
                >
                    <View style={styles.actionIcon}>
                        <Text style={styles.actionIconText}>
                            +
                        </Text>
                    </View>

                    <View style={styles.actionTextContainer}>
                        <Text style={styles.buttonText}>
                            Add Balance
                        </Text>

                        <Text style={styles.buttonDescription}>
                            Add demo money to your wallet
                        </Text>
                    </View>

                    <Text style={styles.arrow}>
                        ›
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                        navigation.navigate("Bills")
                    }
                >
                    <View style={styles.actionIcon}>
                        <Text style={styles.actionIconText}>
                            B
                        </Text>
                    </View>

                    <View style={styles.actionTextContainer}>
                        <Text style={styles.buttonText}>
                            Stored Bills
                        </Text>

                        <Text style={styles.buttonDescription}>
                            View your verified digital bills
                        </Text>
                    </View>

                    <Text style={styles.arrow}>
                        ›
                    </Text>
                </TouchableOpacity>

                <View style={styles.recentCard}>
                    <Text style={styles.recentTitle}>
                        Recent Activity
                    </Text>

                    <Text style={styles.empty}>
                        No transactions yet
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f6f6f7",
    },

    content: {
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 40,
    },

    title: {
        marginTop: 8,
        color: "#18181b",
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: -0.8,
    },

    welcome: {
        marginTop: 5,
        marginBottom: 24,
        color: "#71717a",
        fontSize: 15,
        lineHeight: 21,
    },

    balanceCard: {
        padding: 24,
        marginBottom: 28,
        borderRadius: 18,
        backgroundColor: "#111111",

        elevation: 3,

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.12,
        shadowRadius: 12,
    },

    balanceTitle: {
        color: "#a1a1aa",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },

    balance: {
        marginTop: 8,
        color: "#ffffff",
        fontSize: 38,
        fontWeight: "900",
        letterSpacing: -1,
    },

    smallAddButton: {
        alignSelf: "flex-start",
        marginTop: 18,
        paddingHorizontal: 15,
        paddingVertical: 9,
        borderWidth: 1,
        borderColor: "#dc2626",
        borderRadius: 999,
        backgroundColor: "#dc2626",
    },

    smallAddButtonText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "900",
    },

    sectionTitle: {
        marginBottom: 12,
        color: "#18181b",
        fontSize: 17,
        fontWeight: "900",
        letterSpacing: -0.2,
    },

    button: {
        minHeight: 78,
        padding: 15,
        marginBottom: 11,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e5e5e5",
        borderRadius: 14,
        backgroundColor: "#ffffff",

        elevation: 1,

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },

    actionIcon: {
        width: 46,
        height: 46,
        marginRight: 13,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#fecaca",
        borderRadius: 13,
        backgroundColor: "#fff1f2",
    },

    actionIconText: {
        color: "#dc2626",
        fontSize: 16,
        fontWeight: "900",
    },

    actionTextContainer: {
        flex: 1,
    },

    buttonText: {
        color: "#18181b",
        fontSize: 16,
        fontWeight: "900",
    },

    buttonDescription: {
        marginTop: 3,
        color: "#71717a",
        fontSize: 12,
        lineHeight: 17,
    },

    arrow: {
        marginLeft: 10,
        color: "#a1a1aa",
        fontSize: 25,
        fontWeight: "400",
    },

    recentCard: {
        marginTop: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: "#e5e5e5",
        borderRadius: 14,
        backgroundColor: "#ffffff",

        elevation: 1,

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },

    recentTitle: {
        marginBottom: 9,
        color: "#18181b",
        fontSize: 16,
        fontWeight: "900",
    },

    empty: {
        color: "#8b8b93",
        fontSize: 12,
        lineHeight: 18,
    },
});
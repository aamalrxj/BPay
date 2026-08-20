import {
    useCallback,
    useState,
} from "react";

import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    useFocusEffect,
} from "@react-navigation/native";

import {
    getSavedBills,
} from "../storage/billStorage";

function BillsScreen() {
    const [bills, setBills] =
        useState([]);

    const [
        expandedPaymentId,
        setExpandedPaymentId,
    ] = useState(null);

    const loadBills =
        useCallback(
            async () => {
                const storedBills =
                    await getSavedBills();

                setBills(
                    storedBills
                );
            },
            []
        );

    useFocusEffect(
        useCallback(() => {
            loadBills();
        }, [loadBills])
    );

    const formatMoney = (
        value
    ) => {
        return Number(
            value || 0
        ).toFixed(2);
    };

    const formatDateTime = (
        value
    ) => {
        if (!value) {
            return "-";
        }

        return new Date(
            value
        ).toLocaleString();
    };

    const toggleBill = (
        paymentId
    ) => {
        setExpandedPaymentId(
            (current) =>
                current ===
                paymentId
                    ? null
                    : paymentId
        );
    };

    return (
        <SafeAreaView
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
                <View
                    style={
                        styles.header
                    }
                >
                    <Text
                        style={
                            styles.title
                        }
                    >
                        My Bills
                    </Text>

                    <Text
                        style={
                            styles.description
                        }
                    >
                        Your paid invoices
                    </Text>
                </View>

                {bills.length === 0 ? (
                    <View
                        style={
                            styles.emptyCard
                        }
                    >
                        <Text
                            style={
                                styles.emptyIcon
                            }
                        >
                            🧾
                        </Text>

                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            No bills yet
                        </Text>

                        <Text
                            style={
                                styles.emptyText
                            }
                        >
                            Paid invoices will
                            appear here.
                        </Text>
                    </View>
                ) : (
                    <View
                        style={
                            styles.billList
                        }
                    >
                        {bills.map(
                            (
                                savedBill
                            ) => {
                                const payment =
                                    savedBill
                                        ?.payment;

                                const invoice =
                                    savedBill
                                        ?.invoice;

                                const merchant =
                                    savedBill
                                        ?.merchant;

                                const customer =
                                    savedBill
                                        ?.customer;

                                if (
                                    !payment ||
                                    !invoice
                                ) {
                                    return null;
                                }

                                const shopName =
                                    merchant
                                        ?.merchantName ||
                                    invoice
                                        ?.company
                                        ?.companyName ||
                                    "Unknown Shop";

                                const dateTime =
                                    payment
                                        ?.paidAt ||
                                    payment
                                        ?.createdAt ||
                                    invoice
                                        ?.invoiceDate;

                                const isExpanded =
                                    expandedPaymentId ===
                                    payment.paymentId;

                                return (
                                    <View
                                        key={
                                            payment.paymentId
                                        }
                                        style={
                                            styles.billCard
                                        }
                                    >
                                        <TouchableOpacity
                                            activeOpacity={
                                                0.8
                                            }
                                            onPress={() =>
                                                toggleBill(
                                                    payment.paymentId
                                                )
                                            }
                                        >
                                            <View
                                                style={
                                                    styles.topRow
                                                }
                                            >
                                                <View
                                                    style={
                                                        styles.shopIcon
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.shopIconText
                                                        }
                                                    >
                                                        {shopName
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()}
                                                    </Text>
                                                </View>

                                                <View
                                                    style={
                                                        styles.shopInfo
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.shopName
                                                        }
                                                        numberOfLines={
                                                            1
                                                        }
                                                    >
                                                        {
                                                            shopName
                                                        }
                                                    </Text>

                                                    <Text
                                                        style={
                                                            styles.dateText
                                                        }
                                                    >
                                                        {formatDateTime(
                                                            dateTime
                                                        )}
                                                    </Text>
                                                </View>

                                                <Text
                                                    style={[
                                                        styles.expandArrow,
                                                        isExpanded &&
                                                            styles.expandArrowOpen,
                                                    ]}
                                                >
                                                    ▼
                                                </Text>
                                            </View>

                                            <View
                                                style={
                                                    styles.divider
                                                }
                                            />

                                            <View
                                                style={
                                                    styles.detailRow
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.detailLabel
                                                    }
                                                >
                                                    Invoice No
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.detailValue
                                                    }
                                                >
                                                    {invoice
                                                        ?.invoiceNumber ||
                                                        "-"}
                                                </Text>
                                            </View>

                                            <View
                                                style={
                                                    styles.detailRow
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.detailLabel
                                                    }
                                                >
                                                    Payment ID
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.paymentId
                                                    }
                                                >
                                                    {payment
                                                        ?.paymentId ||
                                                        "-"}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>

                                        {isExpanded && (
                                            <View
                                                style={
                                                    styles.expandedSection
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.sectionTitle
                                                    }
                                                >
                                                    Bill Details
                                                </Text>

                                                <InfoRow
                                                    label="Customer"
                                                    value={
                                                        customer
                                                            ?.customerName ||
                                                        invoice
                                                            ?.customer
                                                            ?.customerName ||
                                                        "-"
                                                    }
                                                />

                                                <InfoRow
                                                    label="Phone"
                                                    value={
                                                        customer
                                                            ?.phoneNumber ||
                                                        invoice
                                                            ?.customer
                                                            ?.phoneNumber ||
                                                        "-"
                                                    }
                                                />

                                                <InfoRow
                                                    label="GSTIN"
                                                    value={
                                                        merchant
                                                            ?.gstin ||
                                                        invoice
                                                            ?.company
                                                            ?.gstin ||
                                                        "-"
                                                    }
                                                />

                                                <InfoRow
                                                    label="Invoice Date"
                                                    value={formatDateTime(
                                                        invoice
                                                            ?.invoiceDate
                                                    )}
                                                />

                                                <InfoRow
                                                    label="Paid Date"
                                                    value={formatDateTime(
                                                        payment
                                                            ?.paidAt
                                                    )}
                                                />

                                                <View
                                                    style={
                                                        styles.productsSection
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.sectionTitle
                                                        }
                                                    >
                                                        Products
                                                    </Text>

                                                    {invoice.products.map(
                                                        (
                                                            product
                                                        ) => (
                                                            <View
                                                                key={`${invoice.invoiceNumber}-${product.serialNumber}`}
                                                                style={
                                                                    styles.productCard
                                                                }
                                                            >
                                                                <View
                                                                    style={
                                                                        styles.productTopRow
                                                                    }
                                                                >
                                                                    <Text
                                                                        style={
                                                                            styles.productName
                                                                        }
                                                                    >
                                                                        {
                                                                            product.serialNumber
                                                                        }
                                                                        .{" "}
                                                                        {
                                                                            product.productName
                                                                        }
                                                                    </Text>

                                                                    <Text
                                                                        style={
                                                                            styles.productTotal
                                                                        }
                                                                    >
                                                                        ₹
                                                                        {formatMoney(
                                                                            product.total
                                                                        )}
                                                                    </Text>
                                                                </View>

                                                                <InfoRow
                                                                    label="Quantity"
                                                                    value={String(
                                                                        product.quantity
                                                                    )}
                                                                />

                                                                <InfoRow
                                                                    label="Rate"
                                                                    value={`₹${formatMoney(
                                                                        product.rate
                                                                    )}`}
                                                                />

                                                                <InfoRow
                                                                    label="Net Amount"
                                                                    value={`₹${formatMoney(
                                                                        product.netAmount
                                                                    )}`}
                                                                />

                                                                <InfoRow
                                                                    label="GST"
                                                                    value={`${product.gstPercentage}%`}
                                                                />

                                                                <InfoRow
                                                                    label="GST Amount"
                                                                    value={`₹${formatMoney(
                                                                        product.gstAmount
                                                                    )}`}
                                                                />
                                                            </View>
                                                        )
                                                    )}
                                                </View>

                                                <View
                                                    style={
                                                        styles.totalsBox
                                                    }
                                                >
                                                    <InfoRow
                                                        label="Total Before Tax"
                                                        value={`₹${formatMoney(
                                                            invoice
                                                                ?.totals
                                                                ?.totalAmountBeforeTax
                                                        )}`}
                                                    />

                                                    <InfoRow
                                                        label="GST Amount"
                                                        value={`₹${formatMoney(
                                                            invoice
                                                                ?.totals
                                                                ?.totalGSTAmount
                                                        )}`}
                                                    />

                                                    <InfoRow
                                                        label="Gross Total"
                                                        value={`₹${formatMoney(
                                                            invoice
                                                                ?.totals
                                                                ?.grossTotal
                                                        )}`}
                                                    />

                                                    <InfoRow
                                                        label="Round Off"
                                                        value={`₹${formatMoney(
                                                            invoice
                                                                ?.totals
                                                                ?.roundOffAmount
                                                        )}`}
                                                    />

                                                    <View
                                                        style={
                                                            styles.receivableRow
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.receivableLabel
                                                            }
                                                        >
                                                            Receivable Amount
                                                        </Text>

                                                        <Text
                                                            style={
                                                                styles.receivableValue
                                                            }
                                                        >
                                                            ₹
                                                            {formatMoney(
                                                                invoice
                                                                    ?.totals
                                                                    ?.receivableAmount
                                                            )}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            }
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoRow({
    label,
    value,
}) {
    return (
        <View
            style={
                styles.infoRow
            }
        >
            <Text
                style={
                    styles.infoLabel
                }
            >
                {label}
            </Text>

            <Text
                style={
                    styles.infoValue
                }
            >
                {value ?? "-"}
            </Text>
        </View>
    );
}

export default BillsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },

    content: {
        paddingHorizontal: 20,
        paddingTop: 26,
        paddingBottom: 44,
    },

    header: {
        marginBottom: 24,
    },

    title: {
        color: "#111111",
        fontSize: 30,
        fontWeight: "900",
        letterSpacing: -0.8,
    },

    description: {
        marginTop: 5,
        color: "#71717a",
        fontSize: 13,
        lineHeight: 19,
    },

    billList: {
        gap: 12,
    },

    billCard: {
        padding: 17,
        borderWidth: 1,
        borderColor: "#e5e5e5",
        borderRadius: 15,
        backgroundColor: "#ffffff",

        elevation: 2,

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.06,
        shadowRadius: 10,
    },

    topRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    shopIcon: {
        width: 46,
        height: 46,
        marginRight: 13,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 23,
        borderWidth: 1,
        borderColor: "#fecaca",
        backgroundColor: "#fff1f2",
    },

    shopIconText: {
        color: "#dc2626",
        fontSize: 18,
        fontWeight: "900",
    },

    shopInfo: {
        flex: 1,
    },

    shopName: {
        color: "#18181b",
        fontSize: 16,
        fontWeight: "900",
        letterSpacing: -0.2,
    },

    dateText: {
        marginTop: 4,
        color: "#71717a",
        fontSize: 11,
    },

    expandArrow: {
        color: "#a1a1aa",
        fontSize: 12,
        transform: [
            {
                rotate: "0deg",
            },
        ],
    },

    expandArrowOpen: {
        transform: [
            {
                rotate: "180deg",
            },
        ],
    },

    divider: {
        marginVertical: 14,
        height: 1,
        backgroundColor: "#eeeeee",
    },

    detailRow: {
        paddingVertical: 6,
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 15,
    },

    detailLabel: {
        color: "#71717a",
        fontSize: 11,
    },

    detailValue: {
        maxWidth: "65%",
        color: "#18181b",
        fontSize: 11,
        fontWeight: "800",
        textAlign: "right",
    },

    paymentId: {
        maxWidth: "65%",
        color: "#dc2626",
        fontSize: 10,
        fontWeight: "800",
        textAlign: "right",
    },

    expandedSection: {
        marginTop: 18,
        paddingTop: 18,
        borderTopWidth: 1,
        borderTopColor: "#eeeeee",
    },

    sectionTitle: {
        marginBottom: 13,
        color: "#18181b",
        fontSize: 15,
        fontWeight: "900",
    },

    infoRow: {
        paddingVertical: 7,
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 15,
    },

    infoLabel: {
        color: "#71717a",
        fontSize: 11,
    },

    infoValue: {
        maxWidth: "65%",
        color: "#27272a",
        fontSize: 11,
        fontWeight: "700",
        textAlign: "right",
    },

    productsSection: {
        marginTop: 18,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#eeeeee",
    },

    productCard: {
        marginBottom: 10,
        padding: 13,
        borderWidth: 1,
        borderColor: "#e5e5e5",
        borderRadius: 10,
        backgroundColor: "#fafafa",
    },

    productTopRow: {
        marginBottom: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },

    productName: {
        flex: 1,
        color: "#18181b",
        fontSize: 13,
        fontWeight: "800",
    },

    productTotal: {
        color: "#dc2626",
        fontSize: 13,
        fontWeight: "900",
    },

    totalsBox: {
        marginTop: 14,
        padding: 15,
        borderWidth: 1,
        borderColor: "#e5e5e5",
        borderRadius: 11,
        backgroundColor: "#fafafa",
    },

    receivableRow: {
        marginTop: 10,
        paddingTop: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#d4d4d8",
    },

    receivableLabel: {
        color: "#111111",
        fontSize: 14,
        fontWeight: "900",
    },

    receivableValue: {
        color: "#dc2626",
        fontSize: 20,
        fontWeight: "900",
    },

    emptyCard: {
        padding: 34,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e5e5e5",
        borderRadius: 15,
        backgroundColor: "#ffffff",

        elevation: 2,

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },

    emptyIcon: {
        fontSize: 42,
        opacity: 0.9,
    },

    emptyTitle: {
        marginTop: 12,
        color: "#18181b",
        fontSize: 18,
        fontWeight: "900",
    },

    emptyText: {
        marginTop: 7,
        maxWidth: 280,
        color: "#71717a",
        fontSize: 13,
        lineHeight: 19,
        textAlign: "center",
    },
});
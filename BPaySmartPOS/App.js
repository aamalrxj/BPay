import {
    useEffect,
    useRef,
    useState,
} from "react";

import QRCode from "react-native-qrcode-svg";
import * as Speech from "expo-speech";

import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const API_BASE_URL = "http://localhost:5000";
const TERMINAL_ID = "POS-001";

export default function App() {
    const [paymentData, setPaymentData] =
        useState(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [
        connectionError,
        setConnectionError,
    ] = useState("");

    const [screen, setScreen] =
        useState("invoice");

    const [timeLeft, setTimeLeft] =
        useState(0);

    const [paidPayment, setPaidPayment] =
        useState(null);

    const announcedPaymentId =
        useRef(null);

    const showMessage = (
        title,
        message
    ) => {
        if (Platform.OS === "web") {
            window.alert(
                `${title}\n\n${message}`
            );

            return;
        }

        Alert.alert(
            title,
            message
        );
    };

    const formatMoney = (value) => {
        return Number(
            value || 0
        ).toFixed(2);
    };

    const formatDate = (value) => {
        if (!value) {
            return "-";
        }

        return new Date(
            value
        ).toLocaleString();
    };

    /*
        QR DATA

        This is the same structure
        understood by our BPay
        customer application.
    */

    const qrPayload =
        paymentData
            ? JSON.stringify({
                  type:
                      "BILLPAY_BACKEND_PAYMENT",

                  paymentId:
                      paymentData.paymentId,

                  apiUrl:
                      API_BASE_URL,
              })
            : "";

    /*
        QR countdown.
    */

    const minutes = String(
        Math.floor(
            timeLeft / 60
        )
    ).padStart(
        2,
        "0"
    );

    const seconds = String(
        timeLeft % 60
    ).padStart(
        2,
        "0"
    );

    /*
        Open QR payment screen.
    */

    const openQRPayment = () => {
        if (!paymentData) {
            return;
        }

        const expiryTime =
            new Date(
                paymentData.expiresAt
            ).getTime();

        const remainingSeconds =
            Math.max(
                0,
                Math.floor(
                    (
                        expiryTime -
                        Date.now()
                    ) / 1000
                )
            );

        if (
            remainingSeconds <= 0
        ) {
            showMessage(
                "Payment expired",
                "Create a new invoice from the shop."
            );

            return;
        }

        setTimeLeft(
            remainingSeconds
        );

        setPaidPayment(
            null
        );

        setScreen(
            "qr"
        );
    };

    /*
        Load payment requests that
        belong specifically to POS-001.
    */

    const loadLatestPendingPayment =
        async () => {
            try {
                const response =
                    await fetch(
                        `${API_BASE_URL}/api/terminals/${TERMINAL_ID}/payments/pending`
                    );

                const responseText =
                    await response.text();

                let payments;

                try {
                    payments =
                        JSON.parse(
                            responseText
                        );
                } catch {
                    throw new Error(
                        "The backend returned an invalid response."
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        payments.message ||
                            "Unable to load payments."
                    );
                }

                if (
                    !Array.isArray(
                        payments
                    )
                ) {
                    throw new Error(
                        "The backend did not return a payment list."
                    );
                }

                /*
                    Only keep valid
                    pending invoices.
                */

                const pendingPayments =
                    payments
                        .filter(
                            (
                                payment
                            ) => {
                                return (
                                    payment.status ===
                                        "PENDING" &&
                                    payment.invoice
                                );
                            }
                        )
                        .sort(
                            (
                                first,
                                second
                            ) => {
                                return (
                                    new Date(
                                        second.createdAt
                                    ).getTime() -
                                    new Date(
                                        first.createdAt
                                    ).getTime()
                                );
                            }
                        );

                const latestPayment =
                    pendingPayments[
                        0
                    ] || null;

                setConnectionError(
                    ""
                );

                setPaymentData(
                    (
                        currentPayment
                    ) => {
                        if (
                            !latestPayment
                        ) {
                            return null;
                        }

                        if (
                            currentPayment
                                ?.paymentId ===
                            latestPayment.paymentId
                        ) {
                            return currentPayment;
                        }

                        return latestPayment;
                    }
                );
            } catch (
                error
            ) {
                console.error(
                    "Automatic payment loading error:",
                    error
                );

                setConnectionError(
                    error.message ||
                        "Unable to connect to the backend."
                );
            } finally {
                setIsLoading(
                    false
                );
            }
        };

    /*
        Check for new invoices
        every two seconds.
    */

    useEffect(() => {
        loadLatestPendingPayment();

        const pollingTimer =
            setInterval(
                loadLatestPendingPayment,
                2000
            );

        return () =>
            clearInterval(
                pollingTimer
            );
    }, []);

    /*
        Hide current invoice.
    */

    const cancelCurrentInvoice =
        () => {
            setPaymentData(
                null
            );

            setPaidPayment(
                null
            );

            setScreen(
                "invoice"
            );
        };

    /*
        QR countdown timer.
    */

    useEffect(() => {
        if (
            screen !== "qr" ||
            !paymentData?.expiresAt
        ) {
            return;
        }

        const updateCountdown =
            () => {
                const expiryTime =
                    new Date(
                        paymentData.expiresAt
                    ).getTime();

                const remaining =
                    Math.max(
                        0,
                        Math.floor(
                            (
                                expiryTime -
                                Date.now()
                            ) /
                                1000
                        )
                    );

                setTimeLeft(
                    remaining
                );

                if (
                    remaining ===
                    0
                ) {
                    setScreen(
                        "invoice"
                    );

                    showMessage(
                        "QR expired",
                        "Create a fresh invoice from the shop."
                    );
                }
            };

        updateCountdown();

        const timer =
            setInterval(
                updateCountdown,
                1000
            );

        return () =>
            clearInterval(
                timer
            );
    }, [
        screen,
        paymentData?.expiresAt,
    ]);

    /*
        Watch backend for successful
        customer payment.
    */

    useEffect(() => {
        if (
            screen !== "qr" ||
            !paymentData?.paymentId
        ) {
            return;
        }

        const checkPaymentStatus =
            async () => {
                try {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/payments/${paymentData.paymentId}`
                        );

                    const result =
                        await response.json();

                    if (
                        !response.ok
                    ) {
                        return;
                    }

                    if (
                        result.status ===
                        "PAID"
                    ) {
                        setPaidPayment(
                            result
                        );

                        setScreen(
                            "success"
                        );

                        /*
                            Announce payment
                            only once.
                        */

                        if (
                            announcedPaymentId
                                .current !==
                            result.paymentId
                        ) {
                            announcedPaymentId.current =
                                result.paymentId;

                            Speech.speak(
                                `Payment of ${formatMoney(
                                    result.amount
                                )} rupees received successfully`,
                                {
                                    language:
                                        "en-IN",

                                    rate:
                                        0.9,
                                }
                            );
                        }
                    }
                } catch (
                    error
                ) {
                    console.error(
                        "Payment status error:",
                        error
                    );
                }
            };

        checkPaymentStatus();

        const timer =
            setInterval(
                checkPaymentStatus,
                2000
            );

        return () =>
            clearInterval(
                timer
            );
    }, [
        screen,
        paymentData?.paymentId,
    ]);

    /*
        Finish success screen
        and wait for another invoice.
    */

    const closeSuccess =
        () => {
            setPaymentData(
                null
            );

            setPaidPayment(
                null
            );

            setScreen(
                "invoice"
            );

            loadLatestPendingPayment();
        };
            return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
                <View style={styles.topBar}>
                    <View>
                        <Text style={styles.brand}>
                            BPay
                        </Text>

                        <Text
                            style={
                                styles.deviceName
                            }
                        >
                            SMART POS
                        </Text>
                    </View>

                    <View
                        style={
                            styles.onlineBadge
                        }
                    >
                        <View
                            style={[
                                styles.onlineDot,
                                connectionError &&
                                    styles.offlineDot,
                            ]}
                        />

                        <Text
                            style={
                                styles.onlineText
                            }
                        >
                            {connectionError
                                ? "Offline"
                                : "Online"}
                        </Text>
                    </View>
                </View>

                {isLoading ? (
                    <View
                        style={
                            styles.waitingCard
                        }
                    >
                        <ActivityIndicator
                            size="large"
                            color="#60a5fa"
                        />

                        <Text
                            style={
                                styles.waitingTitle
                            }
                        >
                            Connecting to shop
                        </Text>

                        <Text
                            style={
                                styles.waitingText
                            }
                        >
                            Loading pending
                            invoices...
                        </Text>
                    </View>
                ) : connectionError ? (
                    <View
                        style={
                            styles.waitingCard
                        }
                    >
                        <View
                            style={
                                styles.errorIcon
                            }
                        >
                            <Text
                                style={
                                    styles.errorIconText
                                }
                            >
                                !
                            </Text>
                        </View>

                        <Text
                            style={
                                styles.waitingTitle
                            }
                        >
                            Connection failed
                        </Text>

                        <Text
                            style={
                                styles.waitingText
                            }
                        >
                            {connectionError}
                        </Text>

                        <TouchableOpacity
                            style={
                                styles.primaryButton
                            }
                            onPress={
                                loadLatestPendingPayment
                            }
                        >
                            <Text
                                style={
                                    styles.primaryButtonText
                                }
                            >
                                Try Again
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : screen ===
                      "success" &&
                  paidPayment ? (
                    <View
                        style={
                            styles.successCard
                        }
                    >
                        <View
                            style={
                                styles.successIcon
                            }
                        >
                            <Text
                                style={
                                    styles.successIconText
                                }
                            >
                                ✓
                            </Text>
                        </View>

                        <Text
                            style={
                                styles.successTitle
                            }
                        >
                            Payment Received
                        </Text>

                        <Text
                            style={
                                styles.successAmount
                            }
                        >
                            ₹
                            {formatMoney(
                                paidPayment.amount
                            )}
                        </Text>

                        <Text
                            style={
                                styles.successShop
                            }
                        >
                            {paidPayment
                                .merchant
                                ?.merchantName ||
                                "Merchant"}
                        </Text>

                        <View
                            style={
                                styles.successDetails
                            }
                        >
                            <DetailRow
                                label="Invoice"
                                value={
                                    paidPayment
                                        .invoice
                                        ?.invoiceNumber
                                }
                            />

                            <DetailRow
                                label="Reference"
                                value={
                                    paidPayment
                                        .mobileReference
                                }
                            />
                        </View>

                        <TouchableOpacity
                            style={
                                styles.primaryButton
                            }
                            onPress={
                                closeSuccess
                            }
                        >
                            <Text
                                style={
                                    styles.primaryButtonText
                                }
                            >
                                Done
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : screen === "qr" &&
                  paymentData ? (
                    <View
                        style={
                            styles.qrPaymentCard
                        }
                    >
                        <Text
                            style={
                                styles.qrShopName
                            }
                        >
                            {paymentData
                                .merchant
                                ?.merchantName ||
                                "Unknown Shop"}
                        </Text>

                        <Text
                            style={
                                styles.qrAmountLabel
                            }
                        >
                            Amount to pay
                        </Text>

                        <Text
                            style={
                                styles.qrAmount
                            }
                        >
                            ₹
                            {formatMoney(
                                paymentData.amount
                            )}
                        </Text>

                        <View
                            style={
                                styles.qrBox
                            }
                        >
                            <QRCode
                                value={
                                    qrPayload
                                }
                                size={230}
                                backgroundColor="#ffffff"
                                color="#0f172a"
                            />
                        </View>

                        <Text
                            style={
                                styles.qrWaitingText
                            }
                        >
                            Waiting for customer
                            payment
                        </Text>

                        <Text
                            style={
                                styles.timerText
                            }
                        >
                            {minutes}:
                            {seconds}
                        </Text>

                        <Text
                            style={
                                styles.qrHint
                            }
                        >
                            Scan using the BPay
                            customer app
                        </Text>

                        <TouchableOpacity
                            style={
                                styles.cancelButton
                            }
                            onPress={() =>
                                setScreen(
                                    "invoice"
                                )
                            }
                        >
                            <Text
                                style={
                                    styles.cancelButtonText
                                }
                            >
                                Back
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : !paymentData ? (
                    <View
                        style={
                            styles.waitingCard
                        }
                    >
                        <View
                            style={
                                styles.posIcon
                            }
                        >
                            <Text
                                style={
                                    styles.posIconText
                                }
                            >
                                POS
                            </Text>
                        </View>

                        <Text
                            style={
                                styles.waitingTitle
                            }
                        >
                            Waiting for invoice
                        </Text>

                        <Text
                            style={
                                styles.waitingText
                            }
                        >
                            Create an invoice on
                            the shop billing
                            website. It will appear
                            here automatically.
                        </Text>

                        <View
                            style={
                                styles.listeningStatus
                            }
                        >
                            <View
                                style={
                                    styles.listeningDot
                                }
                            />

                            <Text
                                style={
                                    styles.listeningText
                                }
                            >
                                Listening for
                                payment requests
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View
                        style={
                            styles.invoiceCard
                        }
                    >
                        <View
                            style={
                                styles.newRequestBadge
                            }
                        >
                            <Text
                                style={
                                    styles.newRequestText
                                }
                            >
                                NEW PAYMENT REQUEST
                            </Text>
                        </View>

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
                                {paymentData
                                    .merchant
                                    ?.merchantName
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    "S"}
                            </Text>
                        </View>

                        <Text
                            style={
                                styles.shopName
                            }
                        >
                            {paymentData
                                .merchant
                                ?.merchantName ||
                                "Unknown Shop"}
                        </Text>

                        <Text
                            style={
                                styles.amountLabel
                            }
                        >
                            Amount payable
                        </Text>

                        <Text
                            style={
                                styles.amount
                            }
                        >
                            ₹
                            {formatMoney(
                                paymentData.amount
                            )}
                        </Text>

                        <View
                            style={
                                styles.invoiceDetails
                            }
                        >
                            <DetailRow
                                label="Invoice number"
                                value={
                                    paymentData
                                        .invoice
                                        ?.invoiceNumber
                                }
                            />

                            <DetailRow
                                label="Invoice date"
                                value={formatDate(
                                    paymentData
                                        .invoice
                                        ?.invoiceDate
                                )}
                            />

                            <DetailRow
                                label="Customer"
                                value={
                                    paymentData
                                        .customer
                                        ?.customerName
                                }
                            />

                            <DetailRow
                                label="Products"
                                value={String(
                                    paymentData
                                        .invoice
                                        ?.products
                                        ?.length ||
                                        0
                                )}
                            />

                            <DetailRow
                                label="Payment ID"
                                value={
                                    paymentData
                                        .paymentId
                                }
                            />
                        </View>

                        <Text
                            style={
                                styles.chooseText
                            }
                        >
                            Choose payment method
                        </Text>

                        <View
                            style={
                                styles.paymentMethods
                            }
                        >
                            <TouchableOpacity
                                style={
                                    styles.methodButton
                                }
                                onPress={
                                    openQRPayment
                                }
                            >
                                <View
                                    style={
                                        styles.methodIcon
                                    }
                                >
                                    <Text
                                        style={
                                            styles.methodIconText
                                        }
                                    >
                                        QR
                                    </Text>
                                </View>

                                <Text
                                    style={
                                        styles.methodTitle
                                    }
                                >
                                    QR Payment
                                </Text>

                                <Text
                                    style={
                                        styles.methodDescription
                                    }
                                >
                                    Customer scans and
                                    pays
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={
                                    styles.methodButton
                                }
                                onPress={() =>
                                    showMessage(
                                        "Card payment",
                                        "Card payment will be added next."
                                    )
                                }
                            >
                                <View
                                    style={
                                        styles.methodIcon
                                    }
                                >
                                    <Text
                                        style={
                                            styles.methodIconText
                                        }
                                    >
                                        CARD
                                    </Text>
                                </View>

                                <Text
                                    style={
                                        styles.methodTitle
                                    }
                                >
                                    Card Payment
                                </Text>

                                <Text
                                    style={
                                        styles.methodDescription
                                    }
                                >
                                    Tap, insert or swipe
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={
                                styles.cancelButton
                            }
                            onPress={
                                cancelCurrentInvoice
                            }
                        >
                            <Text
                                style={
                                    styles.cancelButtonText
                                }
                            >
                                Hide Invoice
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function DetailRow({
    label,
    value,
}) {
    return (
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
                {label}
            </Text>

            <Text
                style={
                    styles.detailValue
                }
            >
                {value || "-"}
            </Text>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#101312",
    },

    content: {
        flexGrow: 1,
        width: "100%",
        maxWidth: 610,
        alignSelf: "center",
        paddingHorizontal: 22,
        paddingTop: 18,
        paddingBottom: 42,
    },

    topBar: {
        marginBottom: 26,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    brand: {
        color: "#f8fafc",
        fontSize: 27,
        fontWeight: "800",
        letterSpacing: -0.6,
    },

    deviceName: {
        marginTop: 2,
        color: "#7f8a86",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.6,
    },

    onlineBadge: {
        paddingHorizontal: 11,
        paddingVertical: 7,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#2a302e",
        borderRadius: 999,
        backgroundColor: "#171b1a",
    },

    onlineDot: {
        width: 7,
        height: 7,
        marginRight: 7,
        borderRadius: 4,
        backgroundColor: "#22c55e",
    },

    offlineDot: {
        backgroundColor: "#ef4444",
    },

    onlineText: {
        color: "#c9d0cd",
        fontSize: 10,
        fontWeight: "700",
    },

    waitingCard: {
        minHeight: 420,
        padding: 28,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#282e2c",
        borderRadius: 18,
        backgroundColor: "#171b1a",
    },

    posIcon: {
        width: 76,
        height: 76,
        marginBottom: 20,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: "#0f766e",
    },

    posIconText: {
        color: "#ffffff",
        fontSize: 21,
        fontWeight: "800",
        letterSpacing: 0.7,
    },

    errorIcon: {
        width: 72,
        height: 72,
        marginBottom: 18,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 36,
        backgroundColor: "#3f1717",
    },

    errorIconText: {
        color: "#fca5a5",
        fontSize: 32,
        fontWeight: "800",
    },

    waitingTitle: {
        color: "#f8fafc",
        fontSize: 23,
        fontWeight: "800",
        textAlign: "center",
        letterSpacing: -0.4,
    },

    waitingText: {
        maxWidth: 360,
        marginTop: 8,
        color: "#8e9894",
        fontSize: 12,
        lineHeight: 19,
        textAlign: "center",
    },

    listeningStatus: {
        marginTop: 26,
        paddingHorizontal: 14,
        paddingVertical: 9,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#29302e",
        borderRadius: 999,
        backgroundColor: "#121615",
    },

    listeningDot: {
        width: 7,
        height: 7,
        marginRight: 8,
        borderRadius: 4,
        backgroundColor: "#22c55e",
    },

    listeningText: {
        color: "#b7c0bc",
        fontSize: 10,
        fontWeight: "700",
    },

    primaryButton: {
        width: "100%",
        marginTop: 20,
        paddingVertical: 14,
        alignItems: "center",
        borderRadius: 10,
        backgroundColor: "#0f766e",
    },

    primaryButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
    },

    invoiceCard: {
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#282e2c",
        borderRadius: 18,
        backgroundColor: "#171b1a",
    },

    newRequestBadge: {
        marginBottom: 18,
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#123d39",
    },

    newRequestText: {
        color: "#7dd3c7",
        fontSize: 9,
        fontWeight: "800",
        letterSpacing: 1.2,
    },

    shopIcon: {
        width: 68,
        height: 68,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 34,
        backgroundColor: "#0f766e",
    },

    shopIconText: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "800",
    },

    shopName: {
        marginTop: 14,
        color: "#f8fafc",
        fontSize: 20,
        fontWeight: "800",
        textAlign: "center",
    },

    amountLabel: {
        marginTop: 22,
        color: "#7f8a86",
        fontSize: 11,
        fontWeight: "600",
    },

    amount: {
        marginTop: 5,
        marginBottom: 24,
        color: "#ffffff",
        fontSize: 44,
        fontWeight: "800",
        letterSpacing: -1.3,
    },

    invoiceDetails: {
        width: "100%",
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "#272d2b",
        borderRadius: 12,
        backgroundColor: "#121615",
    },

    detailRow: {
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#252b29",
    },

    detailLabel: {
        color: "#7f8a86",
        fontSize: 10,
    },

    detailValue: {
        maxWidth: "62%",
        color: "#d8dedb",
        fontSize: 10,
        fontWeight: "700",
        textAlign: "right",
    },

    chooseText: {
        width: "100%",
        marginTop: 24,
        marginBottom: 12,
        color: "#e7ece9",
        fontSize: 14,
        fontWeight: "800",
    },

    paymentMethods: {
        width: "100%",
        flexDirection: "row",
        gap: 10,
    },

    methodButton: {
        flex: 1,
        minHeight: 136,
        padding: 15,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#2a302e",
        borderRadius: 13,
        backgroundColor: "#121615",
    },

    methodIcon: {
        width: 48,
        height: 48,
        marginBottom: 10,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13,
        backgroundColor: "#dff7f3",
    },

    methodIconText: {
        color: "#0f766e",
        fontSize: 12,
        fontWeight: "800",
    },

    methodTitle: {
        color: "#f3f6f5",
        fontSize: 13,
        fontWeight: "800",
        textAlign: "center",
    },

    methodDescription: {
        marginTop: 4,
        color: "#7f8a86",
        fontSize: 9,
        lineHeight: 14,
        textAlign: "center",
    },

    cancelButton: {
        marginTop: 18,
        padding: 10,
    },

    cancelButtonText: {
        color: "#ef9a9a",
        fontSize: 12,
        fontWeight: "700",
    },

    qrPaymentCard: {
        padding: 26,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#282e2c",
        borderRadius: 18,
        backgroundColor: "#171b1a",
    },

    qrShopName: {
        color: "#f8fafc",
        fontSize: 20,
        fontWeight: "800",
        textAlign: "center",
    },

    qrAmountLabel: {
        marginTop: 18,
        color: "#7f8a86",
        fontSize: 11,
    },

    qrAmount: {
        marginTop: 4,
        marginBottom: 20,
        color: "#ffffff",
        fontSize: 44,
        fontWeight: "800",
        letterSpacing: -1.3,
    },

    qrBox: {
        padding: 15,
        borderRadius: 13,
        backgroundColor: "#ffffff",
    },

    qrWaitingText: {
        marginTop: 20,
        color: "#d5dbd8",
        fontSize: 13,
        fontWeight: "700",
        textAlign: "center",
    },

    timerText: {
        marginTop: 7,
        color: "#2dd4bf",
        fontSize: 25,
        fontWeight: "800",
    },

    qrHint: {
        marginTop: 7,
        color: "#7f8a86",
        fontSize: 10,
        textAlign: "center",
    },

    successCard: {
        padding: 28,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#244a3b",
        borderRadius: 18,
        backgroundColor: "#171b1a",
    },

    successIcon: {
        width: 76,
        height: 76,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 38,
        backgroundColor: "#153b2c",
    },

    successIconText: {
        color: "#6ee7b7",
        fontSize: 36,
        fontWeight: "800",
    },

    successTitle: {
        marginTop: 17,
        color: "#f8fafc",
        fontSize: 24,
        fontWeight: "800",
        textAlign: "center",
    },

    successAmount: {
        marginTop: 8,
        color: "#ffffff",
        fontSize: 42,
        fontWeight: "800",
        letterSpacing: -1,
    },

    successShop: {
        marginTop: 4,
        color: "#a5afab",
        fontSize: 12,
        textAlign: "center",
    },

    successDetails: {
        width: "100%",
        marginTop: 20,
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "#272d2b",
        borderRadius: 12,
        backgroundColor: "#121615",
    },
});
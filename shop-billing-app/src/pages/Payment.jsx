import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";

import "../App.css";

const API_BASE_URL = "http://localhost:5000";

function Payment() {
    const location = useLocation();
    const navigate = useNavigate();

    const pageData = location.state;

    const paymentMethod = pageData?.paymentMethod;
    const initialPayment = pageData?.payment;
    const localBill = pageData?.localBill;

    const [payment, setPayment] = useState(
        initialPayment || null
    );

    const [timeLeft, setTimeLeft] = useState(0);

    const [isCheckingPayment, setIsCheckingPayment] =
        useState(false);

    useEffect(() => {
        if (!pageData) {
            navigate("/");
        }
    }, [pageData, navigate]);

    useEffect(() => {
        if (
            paymentMethod !== "UPI" ||
            !payment?.expiresAt
        ) {
            return;
        }

        const updateCountdown = () => {
            const expiryTime = new Date(
                payment.expiresAt
            ).getTime();

            const remainingSeconds = Math.max(
                0,
                Math.floor(
                    (expiryTime - Date.now()) /
                        1000
                )
            );

            setTimeLeft(remainingSeconds);
        };

        updateCountdown();

        const timer = setInterval(
            updateCountdown,
            1000
        );

        return () => clearInterval(timer);
    }, [
        paymentMethod,
        payment?.expiresAt,
    ]);

    useEffect(() => {
        if (
            paymentMethod !== "UPI" ||
            !payment?.paymentId ||
            payment.status === "PAID" ||
            payment.status === "EXPIRED"
        ) {
            return;
        }

        const checkPaymentStatus =
            async () => {
                try {
                    setIsCheckingPayment(true);

                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/payments/${payment.paymentId}`
                        );

                    const result =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            result.message ||
                                "Unable to check payment."
                        );
                    }

                    setPayment(result);

                    if (
                        result.status ===
                        "PAID"
                    ) {
                        savePaidBillToWebsite(
                            result
                        );
                    }
                } catch (error) {
                    console.error(
                        "Payment status error:",
                        error
                    );
                } finally {
                    setIsCheckingPayment(
                        false
                    );
                }
            };

        checkPaymentStatus();

        const pollingTimer =
            setInterval(
                checkPaymentStatus,
                2000
            );

        return () =>
            clearInterval(
                pollingTimer
            );
    }, [
        paymentMethod,
        payment?.paymentId,
        payment?.status,
    ]);

    const savePaidBillToWebsite = (
        paidPayment
    ) => {
        try {
            const storedBills =
                JSON.parse(
                    localStorage.getItem(
                        "sample_shop_paid_bills"
                    ) || "[]"
                );

            const alreadySaved =
                storedBills.some(
                    (storedBill) =>
                        storedBill.paymentId ===
                        paidPayment.paymentId
                );

            if (!alreadySaved) {
                storedBills.unshift(
                    paidPayment
                );

                localStorage.setItem(
                    "sample_shop_paid_bills",
                    JSON.stringify(
                        storedBills
                    )
                );
            }
        } catch (error) {
            console.error(
                "Unable to save paid invoice:",
                error
            );
        }
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

    const minutes = String(
        Math.floor(timeLeft / 60)
    ).padStart(2, "0");

    const seconds = String(
        timeLeft % 60
    ).padStart(2, "0");

    const qrData = payment
        ? JSON.stringify({
              type:
                  "BILLPAY_BACKEND_PAYMENT",

              paymentId:
                  payment.paymentId,

              apiUrl: API_BASE_URL,
          })
        : "";

    if (!pageData) {
        return null;
    }

    if (
        paymentMethod === "UPI" &&
        !payment
    ) {
        return (
            <div className="app">
                <div className="billing-container">
                    <div className="summary-box">
                        <h2>
                            Payment could not
                            be loaded
                        </h2>

                        <button
                            className="generate-button"
                            type="button"
                            onClick={() =>
                                navigate("/")
                            }
                        >
                            Return to Billing
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const invoice =
        payment?.invoice ||
        localBill;

    return (
        <div className="app">
            <div className="billing-container">
                <header className="header">
                    <div>
                        <p className="subtitle">
                            TAX INVOICE
                        </p>

                        <h1>
                            Complete Payment
                        </h1>
                    </div>

                    <div className="shop-name">
                        {invoice?.company
                            ?.companyName ||
                            payment?.merchant
                                ?.merchantName ||
                            "Sample Shop"}
                    </div>
                </header>

                {paymentMethod === "UPI" ? (
                    <div className="payment-page">
                        <div className="payment-left">
                            <h2>
                                Invoice Summary
                            </h2>

                            <div className="summary-box">
                                <div className="invoice-preview-company">
                                    <h3>
                                        {
                                            payment
                                                .merchant
                                                .merchantName
                                        }
                                    </h3>

                                    <p>
                                        {
                                            payment
                                                .merchant
                                                .place
                                        }
                                    </p>

                                    <p>
                                        Phone:{" "}
                                        {
                                            payment
                                                .merchant
                                                .phone1
                                        }
                                        {" / "}
                                        {
                                            payment
                                                .merchant
                                                .phone2
                                        }
                                    </p>

                                    <p>
                                        Email:{" "}
                                        {
                                            payment
                                                .merchant
                                                .email
                                        }
                                    </p>

                                    <p>
                                        GSTIN:{" "}
                                        {
                                            payment
                                                .merchant
                                                .gstin
                                        }
                                    </p>
                                </div>

                                <div className="invoice-preview-meta">
                                    <p>
                                        <strong>
                                            Invoice Number
                                        </strong>
                                        <br />
                                        {
                                            invoice
                                                .invoiceNumber
                                        }
                                    </p>

                                    <p>
                                        <strong>
                                            Invoice Date
                                        </strong>
                                        <br />
                                        {formatDate(
                                            invoice.invoiceDate
                                        )}
                                    </p>

                                    <p>
                                        <strong>
                                            Customer
                                        </strong>
                                        <br />
                                        {
                                            payment
                                                .customer
                                                .customerName
                                        }
                                    </p>

                                    <p>
                                        <strong>
                                            Customer Phone
                                        </strong>
                                        <br />
                                        {
                                            payment
                                                .customer
                                                .phoneNumber
                                        }
                                    </p>

                                    <p>
                                        <strong>
                                            Payment ID
                                        </strong>
                                        <br />
                                        {
                                            payment.paymentId
                                        }
                                    </p>
                                </div>

                                <div className="invoice-products-table-wrapper">
                                    <table className="invoice-products-table invoice-preview-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    Sl No
                                                </th>

                                                <th>
                                                    Product
                                                </th>

                                                <th>
                                                    Qty
                                                </th>

                                                <th>
                                                    Rate
                                                </th>

                                                <th>
                                                    Net
                                                </th>

                                                <th>
                                                    GST %
                                                </th>

                                                <th>
                                                    GST
                                                </th>

                                                <th>
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {invoice.products.map(
                                                (
                                                    product
                                                ) => (
                                                    <tr
                                                        key={`${invoice.invoiceNumber}-${product.serialNumber}`}
                                                    >
                                                        <td>
                                                            {
                                                                product.serialNumber
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                product.productName
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                product.quantity
                                                            }
                                                        </td>

                                                        <td>
                                                            ₹
                                                            {formatMoney(
                                                                product.rate
                                                            )}
                                                        </td>

                                                        <td>
                                                            ₹
                                                            {formatMoney(
                                                                product.netAmount
                                                            )}
                                                        </td>

                                                        <td>
                                                            {
                                                                product.gstPercentage
                                                            }
                                                            %
                                                        </td>

                                                        <td>
                                                            ₹
                                                            {formatMoney(
                                                                product.gstAmount
                                                            )}
                                                        </td>

                                                        <td>
                                                            ₹
                                                            {formatMoney(
                                                                product.total
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="payment-invoice-totals">
                                    <div>
                                        <span>
                                            Total Before
                                            Tax
                                        </span>

                                        <strong>
                                            ₹
                                            {formatMoney(
                                                invoice
                                                    .totals
                                                    .totalAmountBeforeTax
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            GST Amount
                                        </span>

                                        <strong>
                                            ₹
                                            {formatMoney(
                                                invoice
                                                    .totals
                                                    .totalGSTAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Gross Total
                                        </span>

                                        <strong>
                                            ₹
                                            {formatMoney(
                                                invoice
                                                    .totals
                                                    .grossTotal
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Round Off
                                        </span>

                                        <strong>
                                            {Number(
                                                invoice
                                                    .totals
                                                    .roundOffAmount
                                            ) >= 0
                                                ? "+"
                                                : ""}
                                            ₹
                                            {formatMoney(
                                                invoice
                                                    .totals
                                                    .roundOffAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div className="payment-receivable-total">
                                        <span>
                                            Receivable
                                            Amount
                                        </span>

                                        <strong>
                                            ₹
                                            {formatMoney(
                                                invoice
                                                    .totals
                                                    .receivableAmount
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="payment-right">
                            {payment.status ===
                            "PAID" ? (
                                <div className="payment-success-box">
                                    <div className="success-icon">
                                        ✓
                                    </div>

                                    <h2>
                                        Payment
                                        Successful
                                    </h2>

                                    <h3>
                                        ₹
                                        {formatMoney(
                                            payment.amount
                                        )}
                                    </h3>

                                    <p>
                                        The paid
                                        invoice has
                                        been saved on
                                        the shop
                                        website.
                                    </p>

                                    <p>
                                        Reference:
                                        <br />

                                        <strong>
                                            {
                                                payment.mobileReference
                                            }
                                        </strong>
                                    </p>

                                    <button
                                        className="generate-button"
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                "/bills"
                                            )
                                        }
                                    >
                                        View Saved
                                        Bills
                                    </button>

                                    <button
                                        className="back-button"
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                "/"
                                            )
                                        }
                                    >
                                        Create Another
                                        Invoice
                                    </button>
                                </div>
                            ) : payment.status ===
                                  "EXPIRED" ||
                              timeLeft === 0 ? (
                                <div className="expired">
                                    QR Expired
                                </div>
                            ) : (
                                <>
                                    <h2>
                                        Scan QR to Pay
                                    </h2>

                                    <div className="qr-box">
                                        <QRCode
                                            value={
                                                qrData
                                            }
                                            size={
                                                220
                                            }
                                            level="H"
                                        />
                                    </div>

                                    <h3>
                                        ₹
                                        {formatMoney(
                                            payment.amount
                                        )}
                                    </h3>

                                    <div className="timer">
                                        {minutes}:
                                        {seconds}
                                    </div>

                                    <p>
                                        Waiting for
                                        payment...
                                    </p>

                                    <p className="payment-id-text">
                                        {
                                            payment.paymentId
                                        }
                                    </p>

                                    {isCheckingPayment && (
                                        <p className="checking-text">
                                            Checking
                                            payment
                                            status...
                                        </p>
                                    )}
                                </>
                            )}

                            <button
                                className="back-button"
                                type="button"
                                onClick={() =>
                                    navigate("/")
                                }
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="payment-page">
                        <div className="payment-left">
                            <h2>
                                Invoice Summary
                            </h2>

                            <div className="summary-box">
                                <p>
                                    <strong>
                                        Invoice Number
                                    </strong>

                                    <br />

                                    {
                                        invoice.invoiceNumber
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Customer
                                    </strong>

                                    <br />

                                    {
                                        invoice.customer
                                            .customerName
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Receivable
                                        Amount
                                    </strong>

                                    <br />

                                    ₹
                                    {formatMoney(
                                        invoice
                                            .totals
                                            .receivableAmount
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="payment-right">
                            <h2>
                                Payment Method
                            </h2>

                            <div className="cash-card-box">
                                {paymentMethod}
                            </div>

                            <h3>
                                ₹
                                {formatMoney(
                                    invoice.totals
                                        .receivableAmount
                                )}
                            </h3>

                            <button
                                className="generate-button"
                                type="button"
                            >
                                Confirm Payment
                            </button>

                            <button
                                className="back-button"
                                type="button"
                                onClick={() =>
                                    navigate("/")
                                }
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Payment;
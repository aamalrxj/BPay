import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import "../App.css";

const API_BASE_URL =
    "http://localhost:5000";

function ShopBills() {
    const navigate =
        useNavigate();

    const [bills, setBills] =
        useState([]);

    const [
        expandedPaymentId,
        setExpandedPaymentId,
    ] = useState(null);

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [error, setError] =
        useState("");

    const loadBills =
        async () => {
            try {
                setError("");

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/payments`
                    );

                const result =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message ||
                            "Unable to load bills."
                    );
                }

                setBills(
                    Array.isArray(
                        result
                    )
                        ? result
                        : []
                );
            } catch (
                error
            ) {
                console.error(
                    "Bills loading error:",
                    error
                );

                setError(
                    error.message ||
                        "Unable to load bills."
                );
            } finally {
                setIsLoading(
                    false
                );
            }
        };

    useEffect(() => {
        loadBills();

        const refreshTimer =
            setInterval(
                loadBills,
                3000
            );

        return () =>
            clearInterval(
                refreshTimer
            );
    }, []);

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

    const formatMoney = (
        value
    ) => {
        return Number(
            value || 0
        ).toFixed(2);
    };

    const formatDate = (
        value
    ) => {
        if (!value) {
            return "-";
        }

        return new Date(
            value
        ).toLocaleString();
    };

    const getStatusClass = (
        status
    ) => {
        return String(
            status || "UNKNOWN"
        )
            .toLowerCase()
            .replace(
                /[^a-z0-9]/g,
                "-"
            );
    };

    return (
        <div className="app">
            <div className="billing-container">
                <header className="header">
                    <div>
                        <p className="subtitle">
                            SHOP DASHBOARD
                        </p>

                        <h1>
                            Saved Bills
                        </h1>
                    </div>

                    <div className="shop-header-actions">
                        <button
                            className="header-button secondary-header-button"
                            type="button"
                            onClick={
                                loadBills
                            }
                        >
                            Refresh
                        </button>

                        <button
                            className="header-button"
                            type="button"
                            onClick={() =>
                                navigate("/")
                            }
                        >
                            Create Bill
                        </button>
                    </div>
                </header>

                {isLoading ? (
                    <div className="shop-message-card">
                        <h2>
                            Loading bills...
                        </h2>
                    </div>
                ) : error ? (
                    <div className="shop-message-card">
                        <h2>
                            Unable to load bills
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            className="generate-button"
                            type="button"
                            onClick={
                                loadBills
                            }
                        >
                            Try Again
                        </button>
                    </div>
                ) : bills.length ===
                  0 ? (
                    <div className="shop-message-card">
                        <div className="empty-bill-icon">
                            🧾
                        </div>

                        <h2>
                            No saved bills
                        </h2>

                        <p>
                            Create a bill
                            to see it here.
                        </p>

                        <button
                            className="generate-button"
                            type="button"
                            onClick={() =>
                                navigate("/")
                            }
                        >
                            Create First Bill
                        </button>
                    </div>
                ) : (
                    <div className="compact-bills-list">
                        {bills.map(
                            (payment) => {
                                const invoice =
                                    payment.invoice;

                                const isExpanded =
                                    expandedPaymentId ===
                                    payment.paymentId;

                                return (
                                    <article
                                        className={`compact-bill-card ${
                                            isExpanded
                                                ? "compact-bill-card-expanded"
                                                : ""
                                        }`}
                                        key={
                                            payment.paymentId
                                        }
                                    >
                                        <button
                                            type="button"
                                            className="compact-bill-summary"
                                            onClick={() =>
                                                toggleBill(
                                                    payment.paymentId
                                                )
                                            }
                                        >
                                            <div className="compact-bill-main">
                                                <div className="compact-bill-field">
                                                    <span>
                                                        Invoice No
                                                    </span>

                                                    <strong>
                                                        {invoice
                                                            ?.invoiceNumber ||
                                                            "-"}
                                                    </strong>
                                                </div>

                                                <div className="compact-bill-field">
                                                    <span>
                                                        Payment ID
                                                    </span>

                                                    <strong className="compact-payment-id">
                                                        {
                                                            payment.paymentId
                                                        }
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="compact-bill-right">
                                                <span
                                                    className={`shop-status shop-status-${getStatusClass(
                                                        payment.status
                                                    )}`}
                                                >
                                                    {
                                                        payment.status
                                                    }
                                                </span>

                                                <span
                                                    className={`expand-arrow ${
                                                        isExpanded
                                                            ? "expand-arrow-open"
                                                            : ""
                                                    }`}
                                                >
                                                    ▼
                                                </span>
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="expanded-bill-content">
                                                <section className="expanded-company-section">
                                                    <div>
                                                        <h2>
                                                            {payment
                                                                .merchant
                                                                ?.merchantName ||
                                                                invoice
                                                                    ?.company
                                                                    ?.companyName ||
                                                                "Merchant"}
                                                        </h2>

                                                        <p>
                                                            {payment
                                                                .merchant
                                                                ?.place ||
                                                                invoice
                                                                    ?.company
                                                                    ?.place ||
                                                                ""}
                                                        </p>

                                                        <p>
                                                            Phone:{" "}
                                                            {payment
                                                                .merchant
                                                                ?.phone1 ||
                                                                invoice
                                                                    ?.company
                                                                    ?.phone1 ||
                                                                "-"}
                                                            {" / "}
                                                            {payment
                                                                .merchant
                                                                ?.phone2 ||
                                                                invoice
                                                                    ?.company
                                                                    ?.phone2 ||
                                                                "-"}
                                                        </p>

                                                        <p>
                                                            Email:{" "}
                                                            {payment
                                                                .merchant
                                                                ?.email ||
                                                                invoice
                                                                    ?.company
                                                                    ?.email ||
                                                                "-"}
                                                        </p>

                                                        <p>
                                                            GSTIN:{" "}
                                                            {payment
                                                                .merchant
                                                                ?.gstin ||
                                                                invoice
                                                                    ?.company
                                                                    ?.gstin ||
                                                                "-"}
                                                        </p>
                                                    </div>

                                                    <div className="expanded-invoice-meta">
                                                        <div>
                                                            <span>
                                                                Invoice Number
                                                            </span>

                                                            <strong>
                                                                {invoice
                                                                    ?.invoiceNumber ||
                                                                    "-"}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>
                                                                Invoice Date
                                                            </span>

                                                            <strong>
                                                                {formatDate(
                                                                    invoice
                                                                        ?.invoiceDate
                                                                )}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>
                                                                Payment Status
                                                            </span>

                                                            <strong>
                                                                {
                                                                    payment.status
                                                                }
                                                            </strong>
                                                        </div>
                                                    </div>
                                                </section>

                                                <section className="expanded-customer-section">
                                                    <div>
                                                        <span>
                                                            Customer Name
                                                        </span>

                                                        <strong>
                                                            {payment
                                                                .customer
                                                                ?.customerName ||
                                                                invoice
                                                                    ?.customer
                                                                    ?.customerName ||
                                                                "-"}
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            Phone
                                                        </span>

                                                        <strong>
                                                            {payment
                                                                .customer
                                                                ?.phoneNumber ||
                                                                invoice
                                                                    ?.customer
                                                                    ?.phoneNumber ||
                                                                "-"}
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            Payment ID
                                                        </span>

                                                        <strong className="payment-reference">
                                                            {
                                                                payment.paymentId
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            Payment Method
                                                        </span>

                                                        <strong>
                                                            {payment
                                                                .paymentMethod ||
                                                                invoice
                                                                    ?.paymentMethod ||
                                                                "-"}
                                                        </strong>
                                                    </div>
                                                </section>

                                                <section className="expanded-products-section">
                                                    <h3>
                                                        Products
                                                    </h3>

                                                    <div className="expanded-products-table-wrapper">
                                                        <table className="expanded-products-table">
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
                                                                        Net Amount
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
                                                                {invoice
                                                                    ?.products
                                                                    ?.map(
                                                                        (
                                                                            product
                                                                        ) => (
                                                                            <tr
                                                                                key={`${payment.paymentId}-${product.serialNumber}`}
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
                                                </section>

                                                <section className="expanded-bill-totals">
                                                    <div>
                                                        <span>
                                                            Total Amount Before Tax
                                                        </span>

                                                        <strong>
                                                            ₹
                                                            {formatMoney(
                                                                invoice
                                                                    ?.totals
                                                                    ?.totalAmountBeforeTax
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
                                                                    ?.totals
                                                                    ?.totalGSTAmount
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
                                                                    ?.totals
                                                                    ?.grossTotal
                                                            )}
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            Round Off
                                                        </span>

                                                        <strong>
                                                            ₹
                                                            {formatMoney(
                                                                invoice
                                                                    ?.totals
                                                                    ?.roundOffAmount
                                                            )}
                                                        </strong>
                                                    </div>

                                                    <div className="expanded-receivable-row">
                                                        <span>
                                                            Receivable Amount
                                                        </span>

                                                        <strong>
                                                            ₹
                                                            {formatMoney(
                                                                invoice
                                                                    ?.totals
                                                                    ?.receivableAmount ??
                                                                    payment.amount
                                                            )}
                                                        </strong>
                                                    </div>
                                                </section>

                                                <section className="expanded-payment-footer">
                                                    <p>
                                                        Created:{" "}
                                                        <strong>
                                                            {formatDate(
                                                                payment.createdAt
                                                            )}
                                                        </strong>
                                                    </p>

                                                    {payment.paidAt && (
                                                        <p>
                                                            Paid:{" "}
                                                            <strong>
                                                                {formatDate(
                                                                    payment.paidAt
                                                                )}
                                                            </strong>
                                                        </p>
                                                    )}

                                                    {payment.mobileReference && (
                                                        <p>
                                                            Reference:{" "}
                                                            <strong>
                                                                {
                                                                    payment.mobileReference
                                                                }
                                                            </strong>
                                                        </p>
                                                    )}
                                                </section>

                                                {payment.status ===
                                                    "PAID" && (
                                                    <div className="verified-shop-bill">
                                                        Verified payment
                                                        received ✓
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                );
                            }
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ShopBills;
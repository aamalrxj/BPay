import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../App.css";

const API_BASE_URL = "http://localhost:5000";

const SMART_POS_ENABLED_KEY =
    "bpay_smart_pos_enabled";

const SMART_POS_TERMINAL_KEY =
    "bpay_smart_pos_terminal_id";

const COMPANY_DETAILS = {
    companyName: "Sample Shop Private Limited",
    place: "Bank Road, Kozhikode, Kerala - 673001",
    phone1: "+91 98765 43210",
    phone2: "+91 91234 56789",
    email: "sample.shop@example.com",
    gstin: "32ABCDE1234F1Z5",
};

const PRODUCT_CATEGORIES = [
    "Grocery",
    "Electronics",
    "Clothing",
    "Medical",
    "Personal Care",
    "Household",
    "Stationery",
    "Food & Dining",
    "Automotive",
    "Other",
];

const PRODUCT_CATALOG = [
    { name: "Rice", category: "Grocery" },
    { name: "Milk", category: "Grocery" },
    { name: "Bread", category: "Grocery" },
    { name: "Eggs", category: "Grocery" },
    { name: "Sugar", category: "Grocery" },
    { name: "Cooking Oil", category: "Grocery" },

    { name: "Mobile Charger", category: "Electronics" },
    { name: "USB Cable", category: "Electronics" },
    { name: "Earphones", category: "Electronics" },
    { name: "Power Bank", category: "Electronics" },
    { name: "Computer Mouse", category: "Electronics" },

    { name: "T-Shirt", category: "Clothing" },
    { name: "Shirt", category: "Clothing" },
    { name: "Jeans", category: "Clothing" },
    { name: "Shoes", category: "Clothing" },

    { name: "Paracetamol", category: "Medical" },
    { name: "Bandage", category: "Medical" },
    { name: "Cough Syrup", category: "Medical" },
    { name: "Thermometer", category: "Medical" },

    { name: "Soap", category: "Personal Care" },
    { name: "Shampoo", category: "Personal Care" },
    { name: "Toothpaste", category: "Personal Care" },
    { name: "Deodorant", category: "Personal Care" },

    { name: "Detergent", category: "Household" },
    { name: "Floor Cleaner", category: "Household" },
    { name: "Dish Wash", category: "Household" },
    { name: "Garbage Bags", category: "Household" },

    { name: "Pen", category: "Stationery" },
    { name: "Notebook", category: "Stationery" },
    { name: "Pencil", category: "Stationery" },
    { name: "File Folder", category: "Stationery" },

    { name: "Tea", category: "Food & Dining" },
    { name: "Coffee", category: "Food & Dining" },
    { name: "Sandwich", category: "Food & Dining" },
    { name: "Meal", category: "Food & Dining" },

    { name: "Engine Oil", category: "Automotive" },
    { name: "Helmet", category: "Automotive" },
    { name: "Coolant", category: "Automotive" },
    { name: "Bike Chain Lubricant", category: "Automotive" },
];

function findCatalogItem(productName) {
    const normalized =
        String(productName || "")
            .trim()
            .toLowerCase();

    if (!normalized) {
        return null;
    }

    return (
        PRODUCT_CATALOG.find(
            (item) =>
                item.name.toLowerCase() ===
                normalized
        ) || null
    );
}

function createEmptyProduct() {
    return {
        id: crypto.randomUUID(),
        productName: "",
        category: "Other",
        quantity: 1,
        rate: "",
        gstPercentage: 18,
    };
}

function Billing() {
    const navigate = useNavigate();

    const [customerName, setCustomerName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    const [products, setProducts] = useState([
        createEmptyProduct(),
    ]);

    const [paymentMethod, setPaymentMethod] = useState("");
    const [isCreatingBill, setIsCreatingBill] = useState(false);

    const [smartPosEnabled, setSmartPosEnabled] =
        useState(false);

    const [terminalId, setTerminalId] =
        useState("POS-001");

    useEffect(() => {
        const savedEnabled =
            localStorage.getItem(
                SMART_POS_ENABLED_KEY
            );

        const savedTerminalId =
            localStorage.getItem(
                SMART_POS_TERMINAL_KEY
            );

        setSmartPosEnabled(
            savedEnabled === "true"
        );

        if (savedTerminalId) {
            setTerminalId(
                savedTerminalId
            );
        }
    }, []);

    const invoiceNumber = useMemo(() => {
        return `INV-${Date.now()}`;
    }, []);

    const invoiceDate = useMemo(() => {
        return new Date().toISOString();
    }, []);

    const calculatedProducts = products.map(
        (product, index) => {
            const quantity = Number(
                product.quantity || 0
            );

            const rate = Number(
                product.rate || 0
            );

            const gstPercentage = Number(
                product.gstPercentage || 0
            );

            const netAmount =
                quantity * rate;

            const gstAmount =
                netAmount *
                (gstPercentage / 100);

            const total =
                netAmount + gstAmount;

            return {
                ...product,
                serialNumber: index + 1,
                category:
                    product.category ||
                    "Other",
                quantity,
                rate,
                gstPercentage,
                netAmount,
                gstAmount,
                total,
            };
        }
    );

    const totalAmountBeforeTax =
        calculatedProducts.reduce(
            (sum, product) =>
                sum + product.netAmount,
            0
        );

    const totalGSTAmount =
        calculatedProducts.reduce(
            (sum, product) =>
                sum + product.gstAmount,
            0
        );

    const grossTotal =
        totalAmountBeforeTax +
        totalGSTAmount;

    const receivableAmount =
        Math.round(grossTotal);

    const roundOffAmount =
        receivableAmount -
        grossTotal;

    const updateProduct = (
        productId,
        field,
        value
    ) => {
        setProducts(
            (currentProducts) =>
                currentProducts.map(
                    (product) => {
                        if (
                            product.id !==
                            productId
                        ) {
                            return product;
                        }

                        if (
                            field ===
                            "productName"
                        ) {
                            const catalogItem =
                                findCatalogItem(
                                    value
                                );

                            return {
                                ...product,
                                productName:
                                    value,
                                category:
                                    catalogItem
                                        ? catalogItem.category
                                        : product.category ||
                                          "Other",
                            };
                        }

                        return {
                            ...product,
                            [field]:
                                value,
                        };
                    }
                )
        );
    };

    const addProduct = () => {
        setProducts(
            (currentProducts) => [
                ...currentProducts,
                createEmptyProduct(),
            ]
        );
    };

    const removeProduct = (
        productId
    ) => {
        if (
            products.length === 1
        ) {
            alert(
                "The invoice must contain at least one product."
            );

            return;
        }

        setProducts(
            (currentProducts) =>
                currentProducts.filter(
                    (product) =>
                        product.id !==
                        productId
                )
        );
    };

    const validateBill = () => {
        if (!customerName.trim()) {
            alert(
                "Enter the customer name."
            );

            return false;
        }

        if (!phoneNumber.trim()) {
            alert(
                "Enter the customer phone number."
            );

            return false;
        }

        if (
            !smartPosEnabled &&
            !paymentMethod
        ) {
            alert(
                "Select a payment method."
            );

            return false;
        }

        for (
            const product of calculatedProducts
        ) {
            if (
                !product.productName.trim()
            ) {
                alert(
                    `Enter the product name for item ${product.serialNumber}.`
                );

                return false;
            }

            if (
                product.quantity <= 0
            ) {
                alert(
                    `Quantity must be greater than zero for item ${product.serialNumber}.`
                );

                return false;
            }

            if (
                product.rate <= 0
            ) {
                alert(
                    `Rate must be greater than zero for item ${product.serialNumber}.`
                );

                return false;
            }

            if (
                product.gstPercentage <
                    0 ||
                product.gstPercentage >
                    100
            ) {
                alert(
                    `Enter a valid GST percentage for item ${product.serialNumber}.`
                );

                return false;
            }
        }

        return true;
    };

    const generateBill =
        async (event) => {
            event.preventDefault();

            if (!validateBill()) {
                return;
            }

            const invoiceData = {
                invoiceNumber,
                invoiceDate,

                company:
                    COMPANY_DETAILS,

                customer: {
                    customerName:
                        customerName.trim(),

                    phoneNumber:
                        phoneNumber.trim(),
                },

                products:
                    calculatedProducts.map(
                        (product) => ({
                            serialNumber:
                                product.serialNumber,

                            productName:
                                product.productName.trim(),

                            category:
                                product.category ||
                                "Other",

                            quantity:
                                product.quantity,

                            rate:
                                product.rate,

                            netAmount:
                                product.netAmount,

                            gstPercentage:
                                product.gstPercentage,

                            gstAmount:
                                product.gstAmount,

                            total:
                                product.total,
                        })
                    ),

                totals: {
                    totalAmountBeforeTax,
                    totalGSTAmount,
                    grossTotal,
                    roundOffAmount,
                    receivableAmount,
                },

                paymentMethod:
                    smartPosEnabled
                        ? "SMART_POS"
                        : paymentMethod,
            };

            try {
                setIsCreatingBill(
                    true
                );

                if (
                    smartPosEnabled
                ) {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/payments`,
                            {
                                method:
                                    "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },

                                body:
                                    JSON.stringify(
                                        {
                                            terminalId,

                                            merchant:
                                                {
                                                    merchantId:
                                                        "SHOP-001",

                                                    merchantName:
                                                        COMPANY_DETAILS.companyName,

                                                    place:
                                                        COMPANY_DETAILS.place,

                                                    phone1:
                                                        COMPANY_DETAILS.phone1,

                                                    phone2:
                                                        COMPANY_DETAILS.phone2,

                                                    email:
                                                        COMPANY_DETAILS.email,

                                                    gstin:
                                                        COMPANY_DETAILS.gstin,
                                                },

                                            customer:
                                                invoiceData.customer,

                                            invoice:
                                                {
                                                    ...invoiceData,

                                                    paymentMethod:
                                                        "SMART_POS",
                                                },
                                        }
                                    ),
                            }
                        );

                    const result =
                        await response.json();

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            result.message ||
                                "Unable to send invoice to Smart POS."
                        );
                    }

                    navigate(
                        "/payment",
                        {
                            state: {
                                paymentMethod:
                                    "SMART_POS",

                                payment:
                                    result,

                                terminalId,
                            },
                        }
                    );

                    return;
                }

                if (
                    paymentMethod ===
                    "UPI"
                ) {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/payments`,
                            {
                                method:
                                    "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },

                                body:
                                    JSON.stringify(
                                        {
                                            terminalId:
                                                "SHOP-LOCAL",

                                            merchant:
                                                {
                                                    merchantId:
                                                        "SHOP-001",

                                                    merchantName:
                                                        COMPANY_DETAILS.companyName,

                                                    place:
                                                        COMPANY_DETAILS.place,

                                                    phone1:
                                                        COMPANY_DETAILS.phone1,

                                                    phone2:
                                                        COMPANY_DETAILS.phone2,

                                                    email:
                                                        COMPANY_DETAILS.email,

                                                    gstin:
                                                        COMPANY_DETAILS.gstin,
                                                },

                                            customer:
                                                invoiceData.customer,

                                            invoice:
                                                invoiceData,
                                        }
                                    ),
                            }
                        );

                    const result =
                        await response.json();

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            result.message ||
                                "Unable to create the payment request."
                        );
                    }

                    navigate(
                        "/payment",
                        {
                            state: {
                                paymentMethod,
                                payment:
                                    result,
                            },
                        }
                    );

                    return;
                }

                navigate(
                    "/payment",
                    {
                        state: {
                            paymentMethod,
                            localBill:
                                invoiceData,
                        },
                    }
                );
            } catch (error) {
                console.error(
                    "Invoice creation error:",
                    error
                );

                alert(
                    error.message ||
                        "The invoice could not be created."
                );
            } finally {
                setIsCreatingBill(
                    false
                );
            }
        };

    const formatMoney = (
        value
    ) => {
        return Number(
            value || 0
        ).toFixed(2);
    };
        return (
        <div className="app">
            <div className="billing-container">
                <header className="header">
                    <div>
                        <p className="subtitle">
                            SHOP BILLING SYSTEM
                        </p>

                        <h1>
                            Create Tax Invoice
                        </h1>
                    </div>

                    <div className="shop-header-actions">
                        <button
                            className="header-button secondary-header-button"
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/bills"
                                )
                            }
                        >
                            View Saved Bills
                        </button>

                        <button
                            className="header-button secondary-header-button"
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/settings"
                                )
                            }
                        >
                            Settings
                        </button>

                        <div className="shop-name">
                            Sample Shop
                        </div>
                    </div>
                </header>

                <form
                    className="billing-form"
                    onSubmit={
                        generateBill
                    }
                >
                    <section className="invoice-company-section">
                        <div>
                            <p className="invoice-company-name">
                                {
                                    COMPANY_DETAILS.companyName
                                }
                            </p>

                            <p>
                                {
                                    COMPANY_DETAILS.place
                                }
                            </p>

                            <p>
                                Phone:{" "}
                                {
                                    COMPANY_DETAILS.phone1
                                }
                                ,{" "}
                                {
                                    COMPANY_DETAILS.phone2
                                }
                            </p>

                            <p>
                                Email:{" "}
                                {
                                    COMPANY_DETAILS.email
                                }
                            </p>

                            <p>
                                GSTIN:{" "}
                                {
                                    COMPANY_DETAILS.gstin
                                }
                            </p>
                        </div>

                        <div className="invoice-meta">
                            <div>
                                <span>
                                    Invoice Number
                                </span>

                                <strong>
                                    {
                                        invoiceNumber
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Invoice Date
                                </span>

                                <strong>
                                    {new Date(
                                        invoiceDate
                                    ).toLocaleString()}
                                </strong>
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <h2>
                            Customer Details
                        </h2>

                        <div className="input-grid">
                            <div className="input-group">
                                <label>
                                    Customer Name
                                </label>

                                <input
                                    type="text"
                                    value={
                                        customerName
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setCustomerName(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Enter customer name"
                                    disabled={
                                        isCreatingBill
                                    }
                                />
                            </div>

                            <div className="input-group">
                                <label>
                                    Customer Phone
                                </label>

                                <input
                                    type="tel"
                                    value={
                                        phoneNumber
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setPhoneNumber(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Enter phone number"
                                    disabled={
                                        isCreatingBill
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="product-section-header">
                            <h2>
                                Products
                            </h2>

                            <button
                                className="add-product-button"
                                type="button"
                                onClick={
                                    addProduct
                                }
                                disabled={
                                    isCreatingBill
                                }
                            >
                                + Add Product
                            </button>
                        </div>

                        <datalist id="bpay-product-catalog">
                            {PRODUCT_CATALOG.map(
                                (item) => (
                                    <option
                                        key={`${item.category}-${item.name}`}
                                        value={item.name}
                                    >
                                        {item.category}
                                    </option>
                                )
                            )}
                        </datalist>

                        <div className="invoice-products-table-wrapper">
                            <table className="invoice-products-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Sl No
                                        </th>

                                        <th>
                                            Product Name
                                        </th>

                                        <th>
                                            Category
                                        </th>

                                        <th>
                                            Quantity
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

                                        <th />
                                    </tr>
                                </thead>

                                <tbody>
                                    {calculatedProducts.map(
                                        (
                                            product
                                        ) => (
                                            <tr
                                                key={
                                                    product.id
                                                }
                                            >
                                                <td>
                                                    {
                                                        product.serialNumber
                                                    }
                                                </td>

                                                <td>
                                                    <input
                                                        type="text"
                                                        list="bpay-product-catalog"
                                                        value={
                                                            product.productName
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateProduct(
                                                                product.id,
                                                                "productName",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="Type or select product"
                                                    />
                                                </td>

                                                <td>
                                                    <select
                                                        value={
                                                            product.category ||
                                                            "Other"
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateProduct(
                                                                product.id,
                                                                "category",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    >
                                                        {PRODUCT_CATEGORIES.map(
                                                            (
                                                                category
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        category
                                                                    }
                                                                    value={
                                                                        category
                                                                    }
                                                                >
                                                                    {
                                                                        category
                                                                    }
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </td>

                                                <td>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={
                                                            product.quantity
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateProduct(
                                                                product.id,
                                                                "quantity",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </td>

                                                <td>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            product.rate
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateProduct(
                                                                product.id,
                                                                "rate",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                    />
                                                </td>

                                                <td>
                                                    ₹
                                                    {formatMoney(
                                                        product.netAmount
                                                    )}
                                                </td>

                                                <td>
                                                    <select
                                                        value={
                                                            product.gstPercentage
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateProduct(
                                                                product.id,
                                                                "gstPercentage",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    >
                                                        <option value="0">
                                                            0%
                                                        </option>

                                                        <option value="5">
                                                            5%
                                                        </option>

                                                        <option value="12">
                                                            12%
                                                        </option>

                                                        <option value="18">
                                                            18%
                                                        </option>

                                                        <option value="28">
                                                            28%
                                                        </option>
                                                    </select>
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

                                                <td>
                                                    <button
                                                        className="remove-product-button"
                                                        type="button"
                                                        onClick={() =>
                                                            removeProduct(
                                                                product.id
                                                            )
                                                        }
                                                    >
                                                        ×
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                                        <section className="invoice-totals-section">
                        <div className="invoice-total-row">
                            <span>
                                Total Amount Before Tax
                            </span>

                            <strong>
                                ₹
                                {formatMoney(
                                    totalAmountBeforeTax
                                )}
                            </strong>
                        </div>

                        <div className="invoice-total-row">
                            <span>
                                GST Amount
                            </span>

                            <strong>
                                ₹
                                {formatMoney(
                                    totalGSTAmount
                                )}
                            </strong>
                        </div>

                        <div className="invoice-total-row">
                            <span>
                                Gross Total
                            </span>

                            <strong>
                                ₹
                                {formatMoney(
                                    grossTotal
                                )}
                            </strong>
                        </div>

                        <div className="invoice-total-row">
                            <span>
                                Round Off
                            </span>

                            <strong>
                                {roundOffAmount >=
                                0
                                    ? "+"
                                    : ""}
                                ₹
                                {formatMoney(
                                    roundOffAmount
                                )}
                            </strong>
                        </div>

                        <div className="invoice-total-row invoice-receivable-row">
                            <span>
                                Receivable Amount
                            </span>

                            <strong>
                                ₹
                                {formatMoney(
                                    receivableAmount
                                )}
                            </strong>
                        </div>
                    </section>

                    <section className="form-section">
                        <h2>
                            Payment Method
                        </h2>

                        {smartPosEnabled ? (
                            <div className="smart-pos-active-box">
                                <div>
                                    <strong>
                                        BPay Smart POS Enabled
                                    </strong>

                                    <p>
                                        This invoice
                                        will be sent
                                        to{" "}
                                        <b>
                                            {
                                                terminalId
                                            }
                                        </b>
                                        . The customer
                                        can choose QR
                                        or Card on the
                                        Smart POS
                                        device.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="header-button secondary-header-button"
                                    onClick={() =>
                                        navigate(
                                            "/settings"
                                        )
                                    }
                                >
                                    Change Settings
                                </button>
                            </div>
                        ) : (
                            <div className="payment-options">
                                {[
                                    {
                                        value:
                                            "Cash",
                                        icon:
                                            "₹",
                                    },
                                    {
                                        value:
                                            "Card",
                                        icon:
                                            "▣",
                                    },
                                    {
                                        value:
                                            "UPI",
                                        icon:
                                            "QR",
                                    },
                                ].map(
                                    (
                                        method
                                    ) => (
                                        <label
                                            className="payment-card"
                                            key={
                                                method.value
                                            }
                                        >
                                            <input
                                                type="radio"
                                                name="payment"
                                                value={
                                                    method.value
                                                }
                                                checked={
                                                    paymentMethod ===
                                                    method.value
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setPaymentMethod(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />

                                            <span className="payment-icon">
                                                {
                                                    method.icon
                                                }
                                            </span>

                                            <strong>
                                                {
                                                    method.value
                                                }
                                            </strong>
                                        </label>
                                    )
                                )}
                            </div>
                        )}
                    </section>

                    <button
                        className="generate-button"
                        type="submit"
                        disabled={
                            isCreatingBill
                        }
                    >
                        {isCreatingBill
                            ? "Creating Invoice..."
                            : smartPosEnabled
                              ? `Send to ${terminalId}`
                              : "Generate Invoice"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Billing;
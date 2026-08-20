const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = 5000;


/* =========================================================
   FILES
   ========================================================= */

const PAYMENTS_FILE = path.join(
    __dirname,
    "payments.json"
);

const INCOMES_FILE = path.join(
    __dirname,
    "incomes.json"
);


app.use(cors());
app.use(express.json());


/* =========================================================
   PAYMENT STORAGE
   ========================================================= */

function readPayments() {
    try {
        if (
            !fs.existsSync(
                PAYMENTS_FILE
            )
        ) {
            fs.writeFileSync(
                PAYMENTS_FILE,
                JSON.stringify(
                    [],
                    null,
                    2
                )
            );

            return [];
        }

        const fileContent =
            fs.readFileSync(
                PAYMENTS_FILE,
                "utf-8"
            );

        if (
            !fileContent.trim()
        ) {
            return [];
        }

        const payments =
            JSON.parse(
                fileContent
            );

        return Array.isArray(
            payments
        )
            ? payments
            : [];
    } catch (error) {
        console.error(
            "Unable to read payments:",
            error
        );

        return [];
    }
}


function savePayments(
    payments
) {
    fs.writeFileSync(
        PAYMENTS_FILE,
        JSON.stringify(
            payments,
            null,
            2
        )
    );
}


function generatePaymentId() {
    const timestamp =
        Date.now();

    const randomPart =
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

    return `PAY-${timestamp}-${randomPart}`;
}


/* =========================================================
   INCOME STORAGE
   ========================================================= */

function readIncomes() {
    try {
        if (
            !fs.existsSync(
                INCOMES_FILE
            )
        ) {
            fs.writeFileSync(
                INCOMES_FILE,
                JSON.stringify(
                    [],
                    null,
                    2
                )
            );

            return [];
        }

        const fileContent =
            fs.readFileSync(
                INCOMES_FILE,
                "utf-8"
            );

        if (
            !fileContent.trim()
        ) {
            return [];
        }

        const incomes =
            JSON.parse(
                fileContent
            );

        return Array.isArray(
            incomes
        )
            ? incomes
            : [];
    } catch (error) {
        console.error(
            "Unable to read incomes:",
            error
        );

        return [];
    }
}


function saveIncomes(
    incomes
) {
    fs.writeFileSync(
        INCOMES_FILE,
        JSON.stringify(
            incomes,
            null,
            2
        )
    );
}


function generateIncomeId() {
    const timestamp =
        Date.now();

    const randomPart =
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

    return `INC-${timestamp}-${randomPart}`;
}


/* =========================================================
   EXPIRED PAYMENTS
   ========================================================= */

function updateExpiredPayments(
    payments
) {
    let changed =
        false;

    const updatedPayments =
        payments.map(
            (payment) => {
                if (
                    payment.status ===
                        "PENDING" &&
                    new Date() >
                        new Date(
                            payment.expiresAt
                        )
                ) {
                    changed =
                        true;

                    return {
                        ...payment,
                        status:
                            "EXPIRED",
                    };
                }

                return payment;
            }
        );

    if (changed) {
        savePayments(
            updatedPayments
        );
    }

    return updatedPayments;
}


/* =========================================================
   ROOT
   ========================================================= */

app.get(
    "/",
    (
        request,
        response
    ) => {
        response.json({
            message:
                "BillPay backend is running",
        });
    }
);


/* =========================================================
   INCOME API
   ========================================================= */

app.post(
    "/api/incomes",
    (
        request,
        response
    ) => {
        try {
            const {
                incomeId,
                amount,
                category,
                source,
                date,
                createdAt,
            } =
                request.body;

            const numericAmount =
                Number(amount);

            if (
                Number.isNaN(
                    numericAmount
                ) ||
                numericAmount <= 0
            ) {
                return response
                    .status(400)
                    .json({
                        message:
                            "A valid income amount is required.",
                    });
            }

            if (
                !category ||
                !String(
                    category
                ).trim()
            ) {
                return response
                    .status(400)
                    .json({
                        message:
                            "Income category is required.",
                    });
            }

            const incomes =
                readIncomes();

            /*
             * Avoid duplicate imports if
             * mobile sends same income again.
             */
            if (incomeId) {
                const existingIncome =
                    incomes.find(
                        (income) =>
                            income.incomeId ===
                            incomeId
                    );

                if (
                    existingIncome
                ) {
                    return response.json(
                        existingIncome
                    );
                }
            }

            const newIncome = {
                incomeId:
                    incomeId ||
                    generateIncomeId(),

                amount:
                    numericAmount,

                category:
                    String(
                        category
                    ).trim(),

                source:
                    source ||
                    "BPAY_WALLET",

                date:
                    date ||
                    new Date()
                        .toISOString(),

                createdAt:
                    createdAt ||
                    new Date()
                        .toISOString(),
            };

            incomes.unshift(
                newIncome
            );

            saveIncomes(
                incomes
            );

            return response
                .status(201)
                .json(
                    newIncome
                );
        } catch (error) {
            console.error(
                "Income creation error:",
                error
            );

            return response
                .status(500)
                .json({
                    message:
                        "Unable to save income.",
                });
        }
    }
);


app.get(
    "/api/incomes",
    (
        request,
        response
    ) => {
        try {
            return response.json(
                readIncomes()
            );
        } catch (error) {
            console.error(
                "Income loading error:",
                error
            );

            return response
                .status(500)
                .json({
                    message:
                        "Unable to load incomes.",
                });
        }
    }
);


/* =========================================================
   CREATE PAYMENT
   ========================================================= */

app.post(
    "/api/payments",
    (
        request,
        response
    ) => {
        const {
            terminalId,
            merchant,
            customer,
            invoice,
        } =
            request.body;

        if (
            !merchant ||
            !customer ||
            !invoice
        ) {
            return response
                .status(400)
                .json({
                    message:
                        "Merchant, customer and invoice details are required.",
                });
        }

        if (
            !invoice.invoiceNumber ||
            !invoice.invoiceDate
        ) {
            return response
                .status(400)
                .json({
                    message:
                        "Invoice number and invoice date are required.",
                });
        }

        if (
            !Array.isArray(
                invoice.products
            ) ||
            invoice.products
                .length === 0
        ) {
            return response
                .status(400)
                .json({
                    message:
                        "The invoice must contain at least one product.",
                });
        }

        const receivableAmount =
            Number(
                invoice.totals
                    ?.receivableAmount
            );

        if (
            Number.isNaN(
                receivableAmount
            ) ||
            receivableAmount <= 0
        ) {
            return response
                .status(400)
                .json({
                    message:
                        "A valid receivable amount is required.",
                });
        }

        const invalidProduct =
            invoice.products.find(
                (product) => {
                    return (
                        !product.productName ||
                        Number(
                            product.quantity
                        ) <= 0 ||
                        Number(
                            product.rate
                        ) <= 0
                    );
                }
            );

        if (
            invalidProduct
        ) {
            return response
                .status(400)
                .json({
                    message:
                        "Every product must have a name, quantity and rate.",
                });
        }

        const payments =
            readPayments();

        const createdAt =
            new Date();

        /*
         * QR validity:
         * 15 minutes during testing.
         */
        const expiresAt =
            new Date(
                createdAt.getTime() +
                    15 *
                        60 *
                        1000
            );

        const newPayment = {
            paymentId:
                generatePaymentId(),

            terminalId:
                terminalId ||
                "POS-001",

            status:
                "PENDING",

            amount:
                receivableAmount,

            currency:
                "INR",

            paymentMethod:
                invoice.paymentMethod ||
                "UPI",

            merchant: {
                merchantId:
                    merchant.merchantId ||
                    "SHOP-001",

                merchantName:
                    merchant.merchantName ||
                    "Sample Shop",

                place:
                    merchant.place ||
                    "",

                phone1:
                    merchant.phone1 ||
                    "",

                phone2:
                    merchant.phone2 ||
                    "",

                email:
                    merchant.email ||
                    "",

                gstin:
                    merchant.gstin ||
                    "",
            },

            customer: {
                customerName:
                    customer.customerName,

                phoneNumber:
                    customer.phoneNumber,
            },

            invoice: {
                invoiceNumber:
                    invoice.invoiceNumber,

                invoiceDate:
                    invoice.invoiceDate,

                expenseCategory:
                    invoice.expenseCategory ||
                    "Other",

                company:
                    invoice.company ||
                    merchant,

                customer:
                    invoice.customer ||
                    customer,

                products:
                    invoice.products.map(
                        (
                            product,
                            index
                        ) => ({
                            serialNumber:
                                Number(
                                    product.serialNumber
                                ) ||
                                index +
                                    1,

                            productName:
                                product.productName,

                            /*
                             * IMPORTANT:
                             * Category from shop
                             * is preserved here.
                             */
                            category:
                                product.category ||
                                "Other",

                            quantity:
                                Number(
                                    product.quantity
                                ),

                            rate:
                                Number(
                                    product.rate
                                ),

                            netAmount:
                                Number(
                                    product.netAmount
                                ),

                            gstPercentage:
                                Number(
                                    product.gstPercentage
                                ),

                            gstAmount:
                                Number(
                                    product.gstAmount
                                ),

                            total:
                                Number(
                                    product.total
                                ),
                        })
                    ),

                totals: {
                    totalAmountBeforeTax:
                        Number(
                            invoice.totals
                                ?.totalAmountBeforeTax
                        ),

                    totalGSTAmount:
                        Number(
                            invoice.totals
                                ?.totalGSTAmount
                        ),

                    grossTotal:
                        Number(
                            invoice.totals
                                ?.grossTotal
                        ),

                    roundOffAmount:
                        Number(
                            invoice.totals
                                ?.roundOffAmount
                        ),

                    receivableAmount,
                },

                paymentMethod:
                    invoice.paymentMethod ||
                    "UPI",
            },

            createdAt:
                createdAt.toISOString(),

            expiresAt:
                expiresAt.toISOString(),

            paidAt:
                null,

            mobileReference:
                null,
        };

        payments.unshift(
            newPayment
        );

        savePayments(
            payments
        );

        return response
            .status(201)
            .json(
                newPayment
            );
    }
);


/* =========================================================
   GET ONE PAYMENT
   ========================================================= */

app.get(
    "/api/payments/:paymentId",
    (
        request,
        response
    ) => {
        const payments =
            updateExpiredPayments(
                readPayments()
            );

        const payment =
            payments.find(
                (item) =>
                    item.paymentId ===
                    request.params
                        .paymentId
            );

        if (!payment) {
            return response
                .status(404)
                .json({
                    message:
                        "Payment request not found.",
                });
        }

        return response.json(
            payment
        );
    }
);


/* =========================================================
   COMPLETE PAYMENT
   ========================================================= */

app.post(
    "/api/payments/:paymentId/pay",
    (
        request,
        response
    ) => {
        const payments =
            updateExpiredPayments(
                readPayments()
            );

        const paymentIndex =
            payments.findIndex(
                (item) =>
                    item.paymentId ===
                    request.params
                        .paymentId
            );

        if (
            paymentIndex ===
            -1
        ) {
            return response
                .status(404)
                .json({
                    message:
                        "Payment request not found.",
                });
        }

        const payment =
            payments[
                paymentIndex
            ];

        if (
            payment.status ===
            "PAID"
        ) {
            return response
                .status(409)
                .json({
                    message:
                        "This invoice has already been paid.",
                });
        }

        if (
            payment.status ===
            "EXPIRED"
        ) {
            return response
                .status(410)
                .json({
                    message:
                        "This payment QR has expired.",
                });
        }

        const requestedAmount =
            Number(
                request.body
                    .amount
            );

        if (
            Number.isNaN(
                requestedAmount
            ) ||
            requestedAmount !==
                Number(
                    payment.amount
                )
        ) {
            return response
                .status(400)
                .json({
                    message:
                        "The payment amount does not match the invoice.",
                });
        }

        payment.status =
            "PAID";

        payment.paidAt =
            new Date()
                .toISOString();

        payment.mobileReference =
            request.body
                .mobileReference ||
            `MOBILE-${Date.now()}`;

        payments[
            paymentIndex
        ] =
            payment;

        savePayments(
            payments
        );

        return response.json({
            message:
                "Payment completed successfully.",

            payment,
        });
    }
);


/* =========================================================
   ALL PAYMENTS
   ========================================================= */

app.get(
    "/api/payments",
    (
        request,
        response
    ) => {
        const payments =
            updateExpiredPayments(
                readPayments()
            );

        return response.json(
            payments
        );
    }
);


/* =========================================================
   SMART POS PENDING
   ========================================================= */

app.get(
    "/api/terminals/:terminalId/payments/pending",
    (
        request,
        response
    ) => {
        const payments =
            updateExpiredPayments(
                readPayments()
            );

        const pendingPayments =
            payments
                .filter(
                    (payment) => {
                        return (
                            payment.terminalId ===
                                request
                                    .params
                                    .terminalId &&
                            payment.status ===
                                "PENDING"
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

        return response.json(
            pendingPayments
        );
    }
);


/* =========================================================
   SMART POS LATEST
   ========================================================= */

app.get(
    "/api/terminals/:terminalId/payments/latest",
    (
        request,
        response
    ) => {
        const payments =
            updateExpiredPayments(
                readPayments()
            );

        const latestPayment =
            payments
                .filter(
                    (payment) => {
                        return (
                            payment.terminalId ===
                                request
                                    .params
                                    .terminalId &&
                            payment.status ===
                                "PENDING"
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
                )[0] ||
            null;

        return response.json(
            latestPayment
        );
    }
);


/* =========================================================
   CANCEL PAYMENT
   ========================================================= */

app.post(
    "/api/payments/:paymentId/cancel",
    (
        request,
        response
    ) => {
        const payments =
            updateExpiredPayments(
                readPayments()
            );

        const paymentIndex =
            payments.findIndex(
                (item) =>
                    item.paymentId ===
                    request.params
                        .paymentId
            );

        if (
            paymentIndex ===
            -1
        ) {
            return response
                .status(404)
                .json({
                    message:
                        "Payment request not found.",
                });
        }

        const payment =
            payments[
                paymentIndex
            ];

        if (
            payment.status ===
            "PAID"
        ) {
            return response
                .status(409)
                .json({
                    message:
                        "A paid invoice cannot be cancelled.",
                });
        }

        if (
            payment.status ===
            "EXPIRED"
        ) {
            return response
                .status(409)
                .json({
                    message:
                        "This payment request is already expired.",
                });
        }

        payment.status =
            "CANCELLED";

        payment.cancelledAt =
            new Date()
                .toISOString();

        payments[
            paymentIndex
        ] =
            payment;

        savePayments(
            payments
        );

        return response.json({
            message:
                "Payment request cancelled successfully.",

            payment,
        });
    }
);


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `BillPay backend running on port ${PORT}`
        );

        console.log(
            `Computer: http://localhost:${PORT}`
        );

        console.log(
            `Income API: http://localhost:${PORT}/api/incomes`
        );

        console.log(
            `POS-001 pending payments: http://localhost:${PORT}/api/terminals/POS-001/payments/pending`
        );
    }
);
function isSameMonth(
    dateValue
) {
    if (!dateValue) {
        return false;
    }

    const date =
        new Date(
            dateValue
        );

    const now =
        new Date();

    return (
        date.getMonth() ===
            now.getMonth() &&
        date.getFullYear() ===
            now.getFullYear()
    );
}


export function calculateSummary(
    income,
    expenses,
    emis,
    budgets = {}
) {
    const monthlyIncome =
        income
            .filter(
                (item) =>
                    isSameMonth(
                        item.createdAt ||
                            item.date
                    )
            )
            .reduce(
                (
                    sum,
                    item
                ) =>
                    sum +
                    Number(
                        item.amount ||
                            0
                    ),
                0
            );


    const monthlyExpenses =
        expenses
            .filter(
                (item) =>
                    isSameMonth(
                        item.createdAt ||
                            item.date
                    )
            )
            .reduce(
                (
                    sum,
                    item
                ) =>
                    sum +
                    Number(
                        item.amount ||
                            0
                    ),
                0
            );


    const monthlyEmi =
        emis
            .filter(
                (item) =>
                    !item.paid
            )
            .reduce(
                (
                    sum,
                    item
                ) =>
                    sum +
                    Number(
                        item.amount ||
                            0
                    ),
                0
            );


    const categoryTotals =
        {};

    expenses
        .filter(
            (item) =>
                isSameMonth(
                    item.createdAt ||
                        item.date
                )
        )
        .forEach(
            (item) => {
                const category =
                    item.category ||
                    "Other";

                categoryTotals[
                    category
                ] =
                    (
                        categoryTotals[
                            category
                        ] ||
                        0
                    ) +
                    Number(
                        item.amount ||
                            0
                    );
            }
        );


    const remaining =
        monthlyIncome -
        monthlyExpenses -
        monthlyEmi;


    const suggestedSavings =
        remaining > 0
            ? Math.min(
                  remaining *
                      0.4,

                  monthlyIncome *
                      0.2
              )
            : 0;


    const safeToSpend =
        Math.max(
            0,
            remaining -
                suggestedSavings
        );


    const categoryBudgetStatus =
        Object.keys(
            budgets
        ).map(
            (category) => {
                const budget =
                    Number(
                        budgets[
                            category
                        ] ||
                            0
                    );

                const spent =
                    Number(
                        categoryTotals[
                            category
                        ] ||
                            0
                    );

                const remainingBudget =
                    budget -
                    spent;

                const percentage =
                    budget >
                    0
                        ? (spent /
                              budget) *
                          100
                        : 0;

                return {
                    category,

                    budget,

                    spent,

                    remainingBudget,

                    percentage,

                    exceeded:
                        budget >
                            0 &&
                        spent >
                            budget,
                };
            }
        );


    return {
        totalIncome:
            monthlyIncome,

        totalExpense:
            monthlyExpenses,

        totalEmi:
            monthlyEmi,

        remaining,

        suggestedSavings,

        safeToSpend,

        categoryTotals,

        categoryBudgetStatus,
    };
}
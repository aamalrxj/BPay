import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../App.css";

const SMART_POS_ENABLED_KEY =
    "bpay_smart_pos_enabled";

const SMART_POS_TERMINAL_KEY =
    "bpay_smart_pos_terminal_id";

function Settings() {
    const navigate = useNavigate();

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

    const saveSettings = () => {
        const cleanTerminalId =
            terminalId.trim();

        if (
            smartPosEnabled &&
            !cleanTerminalId
        ) {
            alert(
                "Enter a terminal ID."
            );

            return;
        }

        localStorage.setItem(
            SMART_POS_ENABLED_KEY,
            String(
                smartPosEnabled
            )
        );

        localStorage.setItem(
            SMART_POS_TERMINAL_KEY,
            cleanTerminalId ||
                "POS-001"
        );

        alert(
            "Settings saved successfully."
        );
    };

    return (
        <div className="app">
            <div className="billing-container">
                <header className="header">
                    <div>
                        <p className="subtitle">
                            SHOP SETTINGS
                        </p>

                        <h1>
                            Settings
                        </h1>
                    </div>

                    <button
                        className="header-button secondary-header-button"
                        type="button"
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        Back to Billing
                    </button>
                </header>

                <div className="settings-card">
                    <div className="settings-row">
                        <div>
                            <h2>
                                BPay Smart POS
                            </h2>

                            <p>
                                When enabled, invoices
                                will be sent to the
                                selected BPay Smart POS
                                terminal.
                            </p>
                        </div>

                        <button
                            type="button"
                            className={`toggle-button ${
                                smartPosEnabled
                                    ? "toggle-enabled"
                                    : ""
                            }`}
                            onClick={() =>
                                setSmartPosEnabled(
                                    (
                                        current
                                    ) =>
                                        !current
                                )
                            }
                        >
                            <span
                                className={`toggle-circle ${
                                    smartPosEnabled
                                        ? "toggle-circle-enabled"
                                        : ""
                                }`}
                            />

                            <span>
                                {smartPosEnabled
                                    ? "ON"
                                    : "OFF"}
                            </span>
                        </button>
                    </div>

                    <div className="settings-divider" />

                    <div className="settings-field">
                        <label>
                            Terminal ID
                        </label>

                        <input
                            type="text"
                            value={
                                terminalId
                            }
                            onChange={(
                                event
                            ) =>
                                setTerminalId(
                                    event
                                        .target
                                        .value
                                )
                            }
                            placeholder="POS-001"
                            disabled={
                                !smartPosEnabled
                            }
                        />

                        <p>
                            Example:
                            POS-001,
                            POS-002,
                            POS-003
                        </p>
                    </div>

                    <div className="settings-status">
                        <span>
                            Current Mode
                        </span>

                        <strong>
                            {smartPosEnabled
                                ? `Smart POS — ${
                                      terminalId ||
                                      "POS-001"
                                  }`
                                : "Normal Billing"}
                        </strong>
                    </div>

                    <button
                        type="button"
                        className="generate-button"
                        onClick={
                            saveSettings
                        }
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Settings;
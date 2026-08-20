import {
    Route,
    Routes,
} from "react-router-dom";

import Billing from "./pages/Billing";
import Payment from "./pages/Payment";
import ShopBills from "./pages/ShopBills";
import Settings from "./pages/Settings";

function App() {
    return (
        <Routes>
            <Route
                path="/"
                element={<Billing />}
            />

            <Route
                path="/payment"
                element={<Payment />}
            />

            <Route
                path="/bills"
                element={<ShopBills />}
            />

            <Route
                path="/settings"
                element={<Settings />}
            />
        </Routes>
    );
}

export default App;
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import ScanScreen from "../screens/ScanScreen";
import AddBalanceScreen from "../screens/AddBalanceScreen";
import BillsScreen from "../screens/BillsScreen";

const Stack = createNativeStackNavigator();

function AppNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerTitleAlign: "center",
                headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: "#f3f5f9",
                },
            }}
        >
            <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: "BillPay",
                }}
            />

            <Stack.Screen
                name="Scan"
                component={ScanScreen}
                options={{
                    title: "Scan & Pay",
                }}
            />

            <Stack.Screen
                name="Add Balance"
                component={AddBalanceScreen}
                options={{
                    title: "Add Balance",
                }}
            />

            <Stack.Screen
                name="Bills"
                component={BillsScreen}
                options={{
                    title: "My Bills",
                }}
            />
        </Stack.Navigator>
    );
}

export default AppNavigator;
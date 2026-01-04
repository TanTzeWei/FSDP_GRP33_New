import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { PointsProvider } from "./context/PointsContext";
import { CartProvider } from "./context/CartContext";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
	<React.StrictMode>
				<ToastProvider>
					<AuthProvider>
						<PointsProvider>
							<CartProvider>
								<App />
							</CartProvider>
						</PointsProvider>
					</AuthProvider>
				</ToastProvider>
	</React.StrictMode>
);

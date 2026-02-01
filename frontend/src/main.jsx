import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
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
		<HelmetProvider>
			<ToastProvider>
				<AuthProvider>
					<PointsProvider>
						<CartProvider>
							<App />
						</CartProvider>
					</PointsProvider>
				</AuthProvider>
			</ToastProvider>
		</HelmetProvider>
	</React.StrictMode>
);

let commonUrl = "https://sandbox.nets.openapipaas.com/api/v1";

// When running in the browser with Vite, use `import.meta.env`.
// Environment variables accessible to the client must be prefixed with `VITE_`.
// Provide safe fallbacks so `process`/`process.env` references do not throw.
const apiKey = import.meta?.env?.VITE_SANDBOX_API_KEY || "";
const projectId = import.meta?.env?.VITE_SANDBOX_PROJECT_ID || "";

const commonConfigs = {
    apiHeader: {
        "api-key": apiKey, // set via frontend/.env -> VITE_SANDBOX_API_KEY
        "project-id": projectId // set via frontend/.env -> VITE_SANDBOX_PROJECT_ID
    },
    apiUrls: {
        // TODO 5: Fill in API URLs below
        requestNetsApi: () => `${commonUrl}/common/payments/nets-qr/request`,
        queryNetsApi: () => `${commonUrl}/common/payments/nets-qr/query`,
        webhookNetsApi: (txnRetrieval_ref) => `${commonUrl}/common/payments/nets/webhook?txn_retrieval_ref=${txnRetrieval_ref}`,
    },
};

export default commonConfigs;
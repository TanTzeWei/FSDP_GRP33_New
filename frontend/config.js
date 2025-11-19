let commonUrl = "https://sandbox.nets.openapipaas.com/api/v1";

// Load from Vite .env
const apiKey = import.meta.env.VITE_SANDBOX_API_KEY;
const projectId = import.meta.env.VITE_SANDBOX_PROJECT_ID;

const commonConfigs = {
    apiHeader: {
        "api-key": apiKey,
        "project-id": projectId
    },
    apiUrls: {
        requestNetsApi: () => `${commonUrl}/common/payments/nets-qr/request`,
        queryNetsApi: () => `${commonUrl}/common/payments/nets-qr/query`,
        webhookNetsApi: (txnRetrieval_ref) => `${commonUrl}/common/payments/nets/webhook?txn_retrieval_ref=${txnRetrieval_ref}`,
    },
};

// Debug logs
try {
    console.log("[config] API Credentials loaded:");
    console.log("[config] API_KEY:", apiKey, "PROJECT_ID:", projectId);
    console.log("[config] API Headers:", commonConfigs.apiHeader);

    if (!apiKey || !projectId) {
        console.error("[config] ❌ API CREDENTIALS MISSING! Did you restart Vite?");
    } else {
        console.log("[config] ✓ API credentials loaded successfully!");
    }
} catch (e) {
    // ignore logging failures
}

export default commonConfigs;

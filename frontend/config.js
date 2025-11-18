let commonUrl = "https://sandbox.nets.openapipaas.com/api/v1";

const commonConfigs = {
    apiHeader: {
        "api-key": `${process.env.REACT_APP_SANDBOX_API_KEY}`, // TODO 3: Retrieve .env api-key constant
        "project-id": `${process.env.REACT_APP_SANDBOX_PROJECT_ID}` // TODO 4: Retrieve .env project id constant
    },
    apiUrls: {
        // TODO 5: Fill in API URLs below
        requestNetsApi: () => `${commonUrl}/common/payments/nets-qr/request`,
        queryNetsApi: () => `${commonUrl}/common/payments/nets-qr/query`,
        webhookNetsApi: (txnRetrieval_ref) => `${commonUrl}/common/payments/nets/webhook?txn_retrieval_ref=${txnRetrieval_ref}`,
    },
};

export default commonConfigs;
//======================================================================================================
// Keen configuration.
//  WriteKey and ProjectId are public and used for all customers.
//  !! ReadKey should never be included here !!
//======================================================================================================
module.exports = {
    keen: {
        projectId: '532b10acd97b856b6c000005',
        writeKey: 'ca5a2c1dc8dabdf8bcd8e108adb5e92c36fdf16f2dea79c8433f6ef96bd1e2b6a45683d29cf9a9c41f85a4b20412f3acb8e0ebf3b3438a4c437e539b431314162460483d93614e7cc4ee67bf7b447cebced04245456e6dee5eb50ad64c97044d47078f9f0a87ffebc958bfee5db52bce'
    },
    // CustomerAccountIds of accounts which should not send tracking events to the dispatcher
    disabledAccounts: [
        // Test disabled account
        '5777e9f16d38af15178611f1',
        // Real disabled accounts
        '5432a16219e9c0003a3aad36',
        '5513e35c237d77ac23d546f6',
        '5677e9f16d38ef18178633fe'
    ]
};

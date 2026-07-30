#[test_only]
module proof_vault::registry_tests {
    use std::signer;
    use std::string;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use proof_vault::registry;

    fun setup_test(aptos_framework: &signer, admin: &signer, user: &signer) {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(signer::address_of(user));
        registry::initialize(admin);
    }

    #[test(aptos_framework = @0x1, admin = @proof_vault, user = @0x123)]
    fun test_successful_registration(aptos_framework: &signer, admin: &signer, user: &signer) {
        setup_test(aptos_framework, admin, user);
        
        let hash = vector<u8>[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];

        registry::register_evidence(
            user,
            signer::address_of(admin),
            string::utf8(b"Research"),
            string::utf8(b"Quantum Computing Progress"),
            string::utf8(b"2026 Q3 Report"),
            string::utf8(b"Detailed description of quantum advantage."),
            string::utf8(b"2026-07-30"),
            string::utf8(b"blob_123"),
            string::utf8(b"file.pdf"),
            string::utf8(b"application/pdf"),
            1024,
            hash,
            0
        );

        assert!(registry::total_evidence_count(signer::address_of(admin)) == 1, 0);
        let evidence = registry::get_evidence_by_id(signer::address_of(admin), 1);
        assert!(registry::is_blob_registered(signer::address_of(admin), string::utf8(b"blob_123")), 1);
    }

    #[test(aptos_framework = @0x1, admin = @proof_vault, user = @0x123)]
    #[expected_failure(abort_code = 2, location = proof_vault::registry)]
    fun test_duplicate_initialization(aptos_framework: &signer, admin: &signer, user: &signer) {
        setup_test(aptos_framework, admin, user);
        registry::initialize(admin); // Should fail
    }

    #[test(aptos_framework = @0x1, admin = @proof_vault, user = @0x123)]
    #[expected_failure(abort_code = 4, location = proof_vault::registry)]
    fun test_empty_title_rejection(aptos_framework: &signer, admin: &signer, user: &signer) {
        setup_test(aptos_framework, admin, user);
        let hash = vector<u8>[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];

        registry::register_evidence(
            user,
            signer::address_of(admin),
            string::utf8(b"Research"),
            string::utf8(b"Topic"),
            string::utf8(b""), // empty title
            string::utf8(b""),
            string::utf8(b""),
            string::utf8(b"blob_123"),
            string::utf8(b""),
            string::utf8(b""),
            1024,
            hash,
            0
        );
    }

    #[test(aptos_framework = @0x1, admin = @proof_vault, user = @0x123)]
    #[expected_failure(abort_code = 6, location = proof_vault::registry)]
    fun test_invalid_hash_length(aptos_framework: &signer, admin: &signer, user: &signer) {
        setup_test(aptos_framework, admin, user);
        let hash = vector<u8>[0,1,2]; // Not 32 bytes

        registry::register_evidence(
            user,
            signer::address_of(admin),
            string::utf8(b"Research"),
            string::utf8(b"Topic"),
            string::utf8(b"Title"), 
            string::utf8(b""),
            string::utf8(b""),
            string::utf8(b"blob_123"),
            string::utf8(b""),
            string::utf8(b""),
            1024,
            hash,
            0
        );
    }
}

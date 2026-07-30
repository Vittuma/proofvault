module proof_vault::registry {
    use std::string::{Self, String};
    use std::signer;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};
    use std::vector;

    // Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_EMPTY_PROJECT_TOPIC: u64 = 3;
    const E_EMPTY_TITLE: u64 = 4;
    const E_EMPTY_BLOB_ID: u64 = 5;
    const E_INVALID_HASH_LENGTH: u64 = 6;
    const E_ZERO_FILE_SIZE: u64 = 7;
    const E_DESCRIPTION_TOO_LONG: u64 = 8;
    const E_TITLE_TOO_LONG: u64 = 9;
    const E_PROJECT_TOPIC_TOO_LONG: u64 = 10;
    const E_BLOB_ALREADY_REGISTERED: u64 = 11;
    const E_EVIDENCE_NOT_FOUND: u64 = 12;

    const MAX_DESCRIPTION_LENGTH: u64 = 1000;
    const MAX_TITLE_LENGTH: u64 = 100;
    const MAX_PROJECT_TOPIC_LENGTH: u64 = 50;

    struct EvidenceRecord has store, drop, copy {
        id: u64,
        publisher: address,
        category: String,
        project_or_topic: String,
        title: String,
        description: String,
        document_date: String,
        blob_identifier: String,
        original_file_name: String,
        mime_type: String,
        file_size: u64,
        sha256_hash: vector<u8>,
        created_at: u64,
        visibility: u8,
    }

    #[event]
    struct EvidenceRegisteredEvent has drop, store {
        id: u64,
        publisher: address,
        project_or_topic: String,
        blob_identifier: String,
        sha256_hash: vector<u8>,
        timestamp: u64,
    }

    struct Registry has key {
        next_id: u64,
        evidence_records: Table<u64, EvidenceRecord>,
        registered_blobs: Table<String, bool>,
    }

    public entry fun initialize(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<Registry>(addr), E_ALREADY_INITIALIZED);

        move_to(account, Registry {
            next_id: 1,
            evidence_records: table::new(),
            registered_blobs: table::new(),
        });
    }

    public entry fun register_evidence(
        account: &signer,
        registry_address: address,
        category: String,
        project_or_topic: String,
        title: String,
        description: String,
        document_date: String,
        blob_identifier: String,
        original_file_name: String,
        mime_type: String,
        file_size: u64,
        sha256_hash: vector<u8>,
        visibility: u8
    ) acquires Registry {
        let publisher = signer::address_of(account);
        
        assert!(exists<Registry>(registry_address), E_NOT_INITIALIZED);
        let registry = borrow_global_mut<Registry>(registry_address);

        // Validation
        assert!(!string::is_empty(&project_or_topic), E_EMPTY_PROJECT_TOPIC);
        assert!(!string::is_empty(&title), E_EMPTY_TITLE);
        assert!(!string::is_empty(&blob_identifier), E_EMPTY_BLOB_ID);
        assert!(string::length(&project_or_topic) <= MAX_PROJECT_TOPIC_LENGTH, E_PROJECT_TOPIC_TOO_LONG);
        assert!(string::length(&title) <= MAX_TITLE_LENGTH, E_TITLE_TOO_LONG);
        assert!(string::length(&description) <= MAX_DESCRIPTION_LENGTH, E_DESCRIPTION_TOO_LONG);
        assert!(vector::length(&sha256_hash) == 32, E_INVALID_HASH_LENGTH);
        assert!(file_size > 0, E_ZERO_FILE_SIZE);
        assert!(!table::contains(&registry.registered_blobs, blob_identifier), E_BLOB_ALREADY_REGISTERED);

        let id = registry.next_id;
        let created_at = timestamp::now_seconds();

        let record = EvidenceRecord {
            id,
            publisher,
            category,
            project_or_topic,
            title,
            description,
            document_date,
            blob_identifier,
            original_file_name,
            mime_type,
            file_size,
            sha256_hash,
            created_at,
            visibility,
        };

        table::add(&mut registry.evidence_records, id, record);
        table::add(&mut registry.registered_blobs, blob_identifier, true);
        registry.next_id = id + 1;

        event::emit(EvidenceRegisteredEvent {
            id,
            publisher,
            project_or_topic,
            blob_identifier,
            sha256_hash,
            timestamp: created_at,
        });
    }

    #[view]
    public fun total_evidence_count(registry_address: address): u64 acquires Registry {
        if (!exists<Registry>(registry_address)) {
            return 0
        };
        let registry = borrow_global<Registry>(registry_address);
        registry.next_id - 1
    }

    #[view]
    public fun get_evidence_by_id(registry_address: address, id: u64): EvidenceRecord acquires Registry {
        assert!(exists<Registry>(registry_address), E_NOT_INITIALIZED);
        let registry = borrow_global<Registry>(registry_address);
        assert!(table::contains(&registry.evidence_records, id), E_EVIDENCE_NOT_FOUND);
        *table::borrow(&registry.evidence_records, id)
    }

    #[view]
    public fun is_blob_registered(registry_address: address, blob_id: String): bool acquires Registry {
        if (!exists<Registry>(registry_address)) {
            return false
        };
        let registry = borrow_global<Registry>(registry_address);
        table::contains(&registry.registered_blobs, blob_id)
    }
}

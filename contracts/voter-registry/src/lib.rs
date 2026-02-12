//! voter registry contract
//! manages registration and eligibility for onchain voting

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]
#![cfg_attr(feature = "contract-client-gen", allow(unused_imports))]

#[macro_use]
extern crate alloc;

use alloc::vec::Vec;
use alloy_sol_types::sol;
use stylus_sdk::{
    alloy_primitives::{Address, U256},
    prelude::*,
    storage::{StorageAddress, StorageBool, StorageMap, StorageU256},
};

/// storage using the `#[storage]` attribute
#[storage]
#[entrypoint]
pub struct VoterRegistry {
    owner: StorageAddress,
    registered_voters: StorageMap<Address, StorageBool>,
    voter_count: StorageU256,
}

// events and errors
sol! {
    event VoterRegistered(address indexed voter);
    event VoterDeregistered(address indexed voter);
    error AlreadyRegistered(address voter);
    error NotRegistered(address voter);
    error Unauthorized(address caller);
}

/// errors returned by the contract.
#[derive(SolidityError)]
pub enum RegistryError {
    AlreadyRegistered(AlreadyRegistered),
    NotRegistered(NotRegistered),
    Unauthorized(Unauthorized),
}

/// read-only interface for cross-contract calls.
/// auto-generates a type-safe client when used 
/// with the `contract-client-gen` feature.
#[public]
pub trait IVoterRegistry {
    fn is_registered(&self, voter: Address) -> bool;
    fn voter_count(&self) -> U256;
}

/// implements the voter registry interface
#[public]
#[implements(IVoterRegistry)]
impl VoterRegistry {
    /// register the caller as a voter.
    pub fn register(&mut self) -> Result<(), RegistryError> {
        let voter = self.vm().msg_sender();
        if self.registered_voters.get(voter) {
            return Err(RegistryError::AlreadyRegistered(AlreadyRegistered { voter }));
        }
        self.registered_voters.setter(voter).set(true);
        let count = self.voter_count.get();
        self.voter_count.set(count + U256::from(1));

        self.vm().log(VoterRegistered { voter });
        Ok(())
    }

    /// remove the caller from the voter roll.
    pub fn deregister(&mut self) -> Result<(), RegistryError> {
        let voter = self.vm().msg_sender();
        if !self.registered_voters.get(voter) {
            return Err(RegistryError::NotRegistered(NotRegistered { voter }));
        }
        self.registered_voters.setter(voter).set(false);
        let count = self.voter_count.get();
        self.voter_count.set(count - U256::from(1));

        self.vm().log(VoterDeregistered { voter });
        Ok(())
    }

    /// returns the owner of the registry.
    pub fn owner(&self) -> Address {
        self.owner.get()
    }
}

/// trait implementation for voter registry
#[public]
impl IVoterRegistry for VoterRegistry {
    fn is_registered(&self, voter: Address) -> bool {
        self.registered_voters.get(voter)
    }

    fn voter_count(&self) -> U256 {
        self.voter_count.get()
    }
}

// Run with: `cargo test -p voter-registry`
#[cfg(all(test, not(feature = "contract-client-gen")))]
mod tests {
    use super::*;
    use stylus_sdk::testing::*;

    #[test]
    fn test_register_voter() {
        let vm = TestVM::default();
        let mut contract = VoterRegistry::from(&vm);

        assert_eq!(U256::ZERO, contract.voter_count());
        assert!(!contract.is_registered(vm.msg_sender()));

        assert!(contract.register().is_ok());

        assert!(contract.is_registered(vm.msg_sender()));
        assert_eq!(U256::from(1), contract.voter_count());
    }

    #[test]
    fn test_double_registration_fails() {
        let vm = TestVM::default();
        let mut contract = VoterRegistry::from(&vm);

        assert!(contract.register().is_ok());
        let result = contract.register();
        assert!(result.is_err());
    }

    #[test]
    fn test_deregister_voter() {
        let vm = TestVM::default();
        let mut contract = VoterRegistry::from(&vm);

        assert!(contract.register().is_ok());
        assert_eq!(U256::from(1), contract.voter_count());

        assert!(contract.deregister().is_ok());
        assert!(!contract.is_registered(vm.msg_sender()));
        assert_eq!(U256::ZERO, contract.voter_count());
    }

    #[test]
    fn test_deregister_unregistered_fails() {
        let vm = TestVM::default();
        let mut contract = VoterRegistry::from(&vm);

        let result = contract.deregister();
        assert!(result.is_err());
    }

    #[test]
    fn test_voter_count() {
        let vm = TestVM::default();
        let mut contract = VoterRegistry::from(&vm);

        assert_eq!(contract.voter_count(), U256::ZERO);
        assert!(contract.register().is_ok());
        assert_eq!(contract.voter_count(), U256::from(1));
    }
}

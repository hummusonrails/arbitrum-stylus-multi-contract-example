//! polls contract for onchain voting
//! manages create, vote, close, and results operations
#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;
use alloy_sol_types::sol;
use stylus_sdk::{
    alloy_primitives::{Address, U256},
    prelude::*,
    storage::{StorageAddress, StorageBool, StorageMap, StorageString, StorageU256},
};

// auto-generated client for voter registry cross-contract calls
use voter_registry::{VoterRegistry, IVoterRegistry};

/// contract storage state
#[storage]
#[entrypoint]
pub struct Polls {
    /// contract owner address
    owner: StorageAddress,
    /// voter registry contract address
    registry: StorageAddress,
    /// next poll id counter
    next_poll_id: StorageU256,
    /// poll titles by id
    poll_titles: StorageMap<U256, StorageString>,
    /// tracks existing polls
    poll_exists: StorageMap<U256, StorageBool>,
    /// tracks active polls
    poll_active: StorageMap<U256, StorageBool>,
    /// yes vote counts
    yes_votes: StorageMap<U256, StorageU256>,
    /// no vote counts
    no_votes: StorageMap<U256, StorageU256>,
    /// tracks voter participation per poll
    has_voted: StorageMap<U256, StorageMap<Address, StorageBool>>,
}

sol! {
    event PollCreated(uint256 indexed poll_id, address indexed creator);
    event VoteCast(uint256 indexed poll_id, address indexed voter, bool support);
    event PollClosed(uint256 indexed poll_id);

    error PollNotFound(uint256 poll_id);
    error PollNotActive(uint256 poll_id);
    error VoterNotRegistered(address voter);
    error AlreadyVoted(uint256 poll_id, address voter);
    error Unauthorized(address caller);
    error RegistryNotSet();
}

#[derive(SolidityError)]
pub enum PollsError {
    PollNotFound(PollNotFound),
    PollNotActive(PollNotActive),
    VoterNotRegistered(VoterNotRegistered),
    AlreadyVoted(AlreadyVoted),
    Unauthorized(Unauthorized),
    RegistryNotSet(RegistryNotSet),
}

#[public]
impl Polls {
    /// set registry address (call once after deployment)
    pub fn set_registry(&mut self, registry: Address) -> Result<(), PollsError> {
        let caller = self.vm().msg_sender();
        let current_owner = self.owner.get();

        // allow if uninitialized or caller is owner
        if current_owner != Address::ZERO && caller != current_owner {
            return Err(PollsError::Unauthorized(Unauthorized { caller }));
        }

        if current_owner == Address::ZERO {
            self.owner.set(caller);
        }

        self.registry.set(registry);
        Ok(())
    }

    /// create new poll, returns poll id
    pub fn create_poll(&mut self, title: String) -> U256 {
        let poll_id = self.next_poll_id.get();
        self.poll_titles.setter(poll_id).set_str(&title);
        self.poll_exists.setter(poll_id).set(true);
        self.poll_active.setter(poll_id).set(true);
        self.next_poll_id.set(poll_id + U256::from(1));

        self.vm().log(PollCreated {
            poll_id,
            creator: self.vm().msg_sender(),
        });

        poll_id
    }

    /// cast vote on poll, checks registry for voter registration
    pub fn vote(&mut self, poll_id: U256, support: bool) -> Result<(), PollsError> {
        let registry_addr = self.registry.get();
        if registry_addr == Address::ZERO {
            return Err(PollsError::RegistryNotSet(RegistryNotSet {}));
        }

        if !self.poll_exists.get(poll_id) {
            return Err(PollsError::PollNotFound(PollNotFound { poll_id }));
        }
        if !self.poll_active.get(poll_id) {
            return Err(PollsError::PollNotActive(PollNotActive { poll_id }));
        }

        let voter = self.vm().msg_sender();

        // cross-contract call to check voter registration
        let registry = VoterRegistry::new(registry_addr);
        let is_registered: bool = registry
            .is_registered(self.vm(), Call::new(), voter)
            .expect("Cross-contract call to VoterRegistry failed");

        if !is_registered {
            return Err(PollsError::VoterNotRegistered(VoterNotRegistered { voter }));
        }

        if self.has_voted.getter(poll_id).get(voter) {
            return Err(PollsError::AlreadyVoted(AlreadyVoted { poll_id, voter }));
        }

        // record the vote
        self.has_voted.setter(poll_id).setter(voter).set(true);
        if support {
            let current = self.yes_votes.get(poll_id);
            self.yes_votes.setter(poll_id).set(current + U256::from(1));
        } else {
            let current = self.no_votes.get(poll_id);
            self.no_votes.setter(poll_id).set(current + U256::from(1));
        }

        self.vm().log(VoteCast {
            poll_id,
            voter,
            support,
        });

        Ok(())
    }

    /// close poll, only owner can call
    pub fn close_poll(&mut self, poll_id: U256) -> Result<(), PollsError> {
        let caller = self.vm().msg_sender();
        if caller != self.owner.get() {
            return Err(PollsError::Unauthorized(Unauthorized { caller }));
        }
        if !self.poll_exists.get(poll_id) {
            return Err(PollsError::PollNotFound(PollNotFound { poll_id }));
        }

        self.poll_active.setter(poll_id).set(false);

        self.vm().log(PollClosed { poll_id });
        Ok(())
    }

    /// get vote results for a poll
    pub fn get_results(&self, poll_id: U256) -> Result<(U256, U256), PollsError> {
        if !self.poll_exists.get(poll_id) {
            return Err(PollsError::PollNotFound(PollNotFound { poll_id }));
        }
        Ok((self.yes_votes.get(poll_id), self.no_votes.get(poll_id)))
    }

    /// check if address voted on poll
    pub fn has_voted(&self, poll_id: U256, voter: Address) -> bool {
        self.has_voted.getter(poll_id).get(voter)
    }

    /// check if poll is active
    pub fn is_active(&self, poll_id: U256) -> bool {
        self.poll_active.get(poll_id)
    }

    /// get total poll count
    pub fn poll_count(&self) -> U256 {
        self.next_poll_id.get()
    }

    /// get poll title by id
    pub fn get_title(&self, poll_id: U256) -> Result<String, PollsError> {
        if !self.poll_exists.get(poll_id) {
            return Err(PollsError::PollNotFound(PollNotFound { poll_id }));
        }
        Ok(self.poll_titles.getter(poll_id).get_string())
    }

    /// get registry address
    pub fn registry(&self) -> Address {
        self.registry.get()
    }

    /// get owner address
    pub fn owner(&self) -> Address {
        self.owner.get()
    }
}

// unit tests for local logic only
#[cfg(test)]
mod tests {
    use super::*;
    use stylus_sdk::testing::*;

    #[test]
    fn test_create_poll() {
        let vm = TestVM::default();
        let mut contract = Polls::from(&vm);
        let poll_id = contract.create_poll(String::from("Test poll"));
        assert_eq!(poll_id, U256::ZERO);
        assert!(contract.poll_active.get(U256::ZERO));
        assert_eq!(contract.next_poll_id.get(), U256::from(1));
    }

    #[test]
    fn test_create_multiple_polls() {
        let vm = TestVM::default();
        let mut contract = Polls::from(&vm);
        let id0 = contract.create_poll(String::from("Poll A"));
        let id1 = contract.create_poll(String::from("Poll B"));
        let id2 = contract.create_poll(String::from("Poll C"));
        assert_eq!(id0, U256::from(0));
        assert_eq!(id1, U256::from(1));
        assert_eq!(id2, U256::from(2));
        assert_eq!(contract.next_poll_id.get(), U256::from(3));
    }

    #[test]
    fn test_close_poll() {
        let vm = TestVM::default();
        let mut contract = Polls::from(&vm);
        // set_registry also sets owner to msg_sender on first call
        assert!(contract.set_registry(Address::ZERO).is_ok());
        let poll_id = contract.create_poll(String::from("Close me"));
        assert!(contract.poll_active.get(poll_id));

        assert!(contract.close_poll(poll_id).is_ok());
        assert!(!contract.poll_active.get(poll_id));
    }

    #[test]
    fn test_close_poll_unauthorized() {
        let vm = TestVM::default();
        let mut contract = Polls::from(&vm);
        // First call sets owner
        assert!(contract.set_registry(Address::ZERO).is_ok());
        let poll_id = contract.create_poll(String::from("Auth test"));

        // Change msg_sender to a different address
        vm.set_sender(Address::with_last_byte(0x99));
        let result = contract.close_poll(poll_id);
        assert!(result.is_err());
    }

    #[test]
    fn test_get_results_nonexistent_poll() {
        let vm = TestVM::default();
        let contract = Polls::from(&vm);
        let result = contract.get_results(U256::from(999));
        assert!(result.is_err());
    }

    #[test]
    fn test_set_registry() {
        let vm = TestVM::default();
        let mut contract = Polls::from(&vm);
        let registry_addr = Address::with_last_byte(0x42);
        assert!(contract.set_registry(registry_addr).is_ok());
        assert_eq!(contract.registry.get(), registry_addr);
    }
}

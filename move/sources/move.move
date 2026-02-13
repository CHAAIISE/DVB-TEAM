module DVB_TEAM::DVB_TEAM;
use std::string::String;


// Structs
public struct User has key, store {
    name: String,
    friends: vector<address>,
    publications: vector<Post>,
}

public struct Post has key, store{
    title: String,
    content: String,
}

public struct UserRegistery has key {
    id: UID,
    ids: vector<ID>,
    counter: u64,
}
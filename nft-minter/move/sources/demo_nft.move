module demo_nft::demo_nft {
    use std::string::String;
    use sui::display;
    use sui::package;
    use sui::event;

    // === Structs ===

    /// One-Time-Witness pour le Display
    public struct DEMO_NFT has drop {}

    /// L'objet NFT lui-même
    public struct DemoNFT has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: String,
        creator: address,
    }

    // === Events ===

    public struct NFTMinted has copy, drop {
        nft_id: ID,
        name: String,
        creator: address,
    }

    // === Init (Display) ===

    fun init(otw: DEMO_NFT, ctx: &mut TxContext) {
        let keys = vector[
            b"name".to_string(),
            b"description".to_string(),
            b"image_url".to_string(),
            b"creator".to_string(),
            b"project_url".to_string(),
        ];

        let values = vector[
            b"{name}".to_string(),
            b"{description}".to_string(),
            b"{image_url}".to_string(),
            b"{creator}".to_string(),
            b"https://dvb-team.vercel.app".to_string(),
        ];

        let publisher = package::claim(otw, ctx);
        let mut nft_display = display::new_with_fields<DemoNFT>(
            &publisher, keys, values, ctx,
        );

        nft_display.update_version();

        transfer::public_transfer(publisher, ctx.sender());
        transfer::public_transfer(nft_display, ctx.sender());
    }

    // === Public Functions ===

    /// Mint un NFT et l'envoie au caller
    public entry fun mint(
        name: String,
        description: String,
        image_url: String,
        ctx: &mut TxContext,
    ) {
        let nft = DemoNFT {
            id: object::new(ctx),
            name,
            description,
            image_url,
            creator: ctx.sender(),
        };

        event::emit(NFTMinted {
            nft_id: object::id(&nft),
            name: nft.name,
            creator: ctx.sender(),
        });

        transfer::public_transfer(nft, ctx.sender());
    }

    /// Mint un NFT et l'envoie à une adresse spécifique
    public entry fun mint_to(
        name: String,
        description: String,
        image_url: String,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        let nft = DemoNFT {
            id: object::new(ctx),
            name,
            description,
            image_url,
            creator: ctx.sender(),
        };

        event::emit(NFTMinted {
            nft_id: object::id(&nft),
            name: nft.name,
            creator: ctx.sender(),
        });

        transfer::public_transfer(nft, recipient);
    }

    /// Burn un NFT
    public entry fun burn(nft: DemoNFT) {
        let DemoNFT { id, name: _, description: _, image_url: _, creator: _ } = nft;
        object::delete(id);
    }
}

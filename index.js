const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { cryptoWaitReady } = require('@polkadot/util-crypto');

const MNUEMONIC = 'shift sniff visual already minimum love vital pave rose twice lady witness';

const main = async () => {
    await cryptoWaitReady();

    const keyring = new Keyring({ type: 'sr25519', ss58Format: 42 });
    const keypair = keyring.createFromUri(MNUEMONIC);

    const api = await ApiPromise.create({
        provider: new WsProvider('wss://westend-rpc.polkadot.io')
    });

    const block = await api.rpc.chain.getBlock();
    const blockHash = await api.rpc.chain.getBlockHash();
    const genesisHash = await api.genesisHash;
    const { specVersion, transactionVersion } = await api.rpc.state.getRuntimeVersion();
    const nonce = await api.rpc.system.accountNextIndex('6u6j2CjsymP9vkUu246i4ZEj1FMAA9F92TyUqZx8BVs7V3z');

    const transactionPayload = {
        specVersion: specVersion.toHex(),
        transactionVersion: transactionVersion.toHex(),
        address: `6u6j2CjsymP9vkUu246i4ZEj1FMAA9F92TyUqZx8BVs7V3z`,
        blockHash: blockHash.hash.toHex(),
        blockNumber: block.block.header.number.toHex(),
        era: '0x3501',
        genesisHash: genesisHash.toHex(),
        method: '0x1d0100005039278c0400000000000000000000',
        nonce: nonce.toHex(),
        signedExtensions: [
          'CheckNonZeroSender',
          'CheckSpecVersion',
          'CheckTxVersion',
          'CheckGenesis',
          'CheckMortality',
          'CheckNonce',
          'CheckWeight',
          'ChargeTransactionPayment',
        ],
        tip: '0x00000000000000000000000000000000',
        version: 4,
    };

    const signingPayload = api.registry.createType('ExtrinsicPayload', transactionPayload, {
        version: transactionPayload.version
    });

    const { signature } = signingPayload.sign(keypair);

    const extrinsic = api.registry.createType(
        'Extrinsic',
        { method: transactionPayload.method },
        { version: transactionPayload.version }
    );

    extrinsic.addSignature(transactionPayload.address, signature, transactionPayload)

    const h = await api.rpc.author.submitExtrinsic(extrinsic.toHex());

    console.log(h);
}

main().catch(err => console.error(err));
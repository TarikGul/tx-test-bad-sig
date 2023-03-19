const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { stringToU8a, u8aToHex } = require('@polkadot/util');

const main = async () => {
    await cryptoWaitReady();

    const keyring = new Keyring({ type: 'sr25519', ss58Format: 42 });
    const keypair = keyring.createFromUri(MNUEMONIC, {}, 'sr25519');
    // console.log('Address: ', keypair.address);
    // const msg = stringToU8a('this is a message');
    // const s = keypair.sign(msg);
    // const valid = keypair.verify(msg, s, keypair.publicKey)
    // console.log('VALID: ', valid)

    const api = await ApiPromise.create({
        provider: new WsProvider('wss://westend-rpc.polkadot.io')
    });

    const block = await api.rpc.chain.getBlock();
    const blockHash = await api.rpc.chain.getBlockHash();
    const genesisHash = await api.genesisHash;
    const { specVersion, transactionVersion } = await api.rpc.state.getRuntimeVersion();
    const nonce = await api.rpc.system.accountNextIndex('5CB9KhQGdudBZLLW2r85C1TfDu7QQfxasbBMhrwJ7EsreTGK');

    const transactionPayload = {
        specVersion: specVersion.toHex(),
        transactionVersion: transactionVersion.toHex(),
        address: `5CB9KhQGdudBZLLW2r85C1TfDu7QQfxasbBMhrwJ7EsreTGK`,
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

    const sig = keypair.sign(signingPayload);
    const { signature } = signingPayload.sign(keypair);

    const extrinsic = api.registry.createType(
        'Extrinsic',
        { method: transactionPayload.method },
        { version: transactionPayload.version }
    );

    extrinsic.addSignature(transactionPayload.address, u8aToHex(sig), transactionPayload)

    const isValid = keypair.verify(extrinsic, sig, keypair.publicKey);

    console.log(isValid);

    // const h = await api.rpc.author.submitExtrinsic(extrinsic.toHex());

    // console.log(h);
}

main().catch(err => console.error(err));
const argon2 = require('argon2');

async function testHash() {
    try {
        const password = 'admin';
        const hash = await argon2.hash(password);
        console.log('Hash:', hash);
        const verify = await argon2.verify(hash, password);
        console.log('Verify Result:', verify);
    } catch (error) {
        console.error(error);
    }
}

testHash();

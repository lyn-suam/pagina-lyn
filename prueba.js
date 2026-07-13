const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function probarConexion() {
    try {
        console.log("⏳ Levantando servidor local portátil...");
        
        // 1. Creamos el servidor virtual en tu máquina
        const mongoServer = await MongoMemoryServer.create();
        const uriLocal = mongoServer.getUri();
        
        console.log(`🔗 Conectando al mapa local: ${uriLocal}`);
        
        // 2. Conectamos el cliente de MongoDB a ese servidor virtual
        const client = new MongoClient(uriLocal);
        await client.connect();
        
        // 3. Hacemos la prueba de verificación (ping)
        await client.db("admin").command({ ping: 1 });
        
        console.log("✅ ¡ÉXITO! Tu script se ha conectado correctamente a MongoDB local.");
        
        // Cerramos la conexión limpiamente
        await client.close();
        await mongoServer.stop();

    } catch (error) {
        console.error("❌ ERROR EN LA PRUEBA:");
        console.error(error);
    }
}

probarConexion();
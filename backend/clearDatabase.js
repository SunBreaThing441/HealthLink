import 'dotenv/config';
import mongoose from './src/config/db.js';

// Import all models
import Client from './src/models/client.model.js';
import Doctor from './src/models/doctor.models.js';
import Chat from './src/models/chat.model.js';
import Medicine from './src/models/medicine.model.js';
import Payment from './src/models/payment.model.js';
import Schedule from './src/models/schedule.model.js';
import SlotRequest from './src/models/slotRequest.model.js';
import Video from './src/models/video.model.js';

const clearDatabase = async () => {
    try {
        // Connect to PostgreSQL
        console.log('Connecting to PostgreSQL...');
        await mongoose.connect();
        console.log('✅ Connected to PostgreSQL\n');

        // Clear all collections
        console.log('🗑️  Clearing database collections...\n');

        const collections = [
            { name: 'Clients', model: Client },
            { name: 'Doctors', model: Doctor },
            { name: 'Chats', model: Chat },
            { name: 'Medicines', model: Medicine },
            { name: 'Payments', model: Payment },
            { name: 'Schedules', model: Schedule },
            { name: 'Slot Requests', model: SlotRequest },
            { name: 'Videos', model: Video }
        ];

        for (const collection of collections) {
            const result = await collection.model.deleteMany({});
            console.log(`  ✓ ${collection.name}: Deleted ${result.deletedCount} documents`);
        }

        console.log('\n✅ Database cleared successfully!');
        console.log('You can now do a fresh signup.\n');

        // Close connection
        await mongoose.connection.close();
        console.log('Database connection closed.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error clearing database:', error.message);
        process.exit(1);
    }
};

// Run the script
clearDatabase();

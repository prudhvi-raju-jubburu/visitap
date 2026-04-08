const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

const usage = () => {
    console.log('\nUsage:');
    console.log('node manageAdmins.js add <username> <email> <password> <role>');
    console.log('node manageAdmins.js update <username> <new_password>');
    console.log('node manageAdmins.js list');
    console.log('node manageAdmins.js delete <username>');
    process.exit(0);
};

const run = async () => {
    await connectDB();
    const args = process.argv.slice(2);
    const action = args[0];

    try {
        switch (action) {
            case 'add':
                if (args.length < 5) usage();
                const [_, username, email, password, role] = args;
                await Admin.create({ username, email, password, role });
                console.log(`Admin ${username} created successfully!`);
                break;

            case 'update':
                if (args.length < 3) usage();
                const userToUpdate = args[1];
                const newPass = args[2];
                const admin = await Admin.findOne({ username: userToUpdate });
                if (!admin) {
                    console.log('Admin not found');
                } else {
                    admin.password = newPass;
                    await admin.save();
                    console.log(`Password for ${userToUpdate} updated successfully!`);
                }
                break;

            case 'list':
                const admins = await Admin.find({});
                console.log('\nExisting Admins:');
                admins.forEach(a => {
                    console.log(`- ${a.username} (${a.email}) [Role: ${a.role}]`);
                });
                break;

            case 'delete':
                if (args.length < 2) usage();
                const userToDelete = args[1];
                await Admin.deleteOne({ username: userToDelete });
                console.log(`Admin ${userToDelete} deleted.`);
                break;

            default:
                usage();
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        mongoose.connection.close();
    }
};

run();

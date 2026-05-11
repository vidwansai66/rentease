require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Rental = require('./models/Rental');
const MaintenanceRequest = require('./models/MaintenanceRequest');
const Admin = require('./models/Admin');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany();
        await Category.deleteMany();
        await Product.deleteMany();
        await Order.deleteMany();
        await Rental.deleteMany();
        await MaintenanceRequest.deleteMany();
        await Admin.deleteMany();
        console.log('Cleared existing data.');

        // 1. Create Admins
        const admins = await Admin.create([
            {
                name: 'Super Admin',
                email: 'superadmin@rentease.com',
                password: 'Admin@123',
                role: 'superadmin',
                permissions: ['all']
            },
            {
                name: 'Operations Manager',
                email: 'manager@rentease.com',
                password: 'Manager@123',
                role: 'manager',
                permissions: ['inventory', 'orders']
            }
        ]);
        console.log('Seeded Admins.');

        // 2. Create Categories
        const categoriesData = [
            { name: 'Sofas & Seating', slug: 'sofas-seating', sortOrder: 1, icon: 'sofa' },
            { name: 'Beds & Mattresses', slug: 'beds-mattresses', sortOrder: 2, icon: 'bed' },
            { name: 'Study & Work Desks', slug: 'study-work-desks', sortOrder: 3, icon: 'desk' },
            { name: 'Appliances', slug: 'appliances', sortOrder: 4, icon: 'fridge' },
            { name: 'Storage & Wardrobes', slug: 'storage-wardrobes', sortOrder: 5, icon: 'closet' },
            { name: 'Dining Sets', slug: 'dining-sets', sortOrder: 6, icon: 'table' },
            { name: 'Home Decor', slug: 'home-decor', sortOrder: 7, icon: 'lamp' },
            { name: 'Packages', slug: 'packages', sortOrder: 8, icon: 'box' }
        ];
        const categories = await Category.create(categoriesData);
        console.log('Seeded Categories.');

        // 3. Create Products
        const productsData = [
            {
                name: 'Azure Velvet 3-Seater Sofa',
                slug: 'azure-velvet-sofa',
                category: categories[0]._id,
                description: 'A premium azure blue velvet sofa with ergonomic support and modern design.',
                shortDescription: 'Elegant 3-seater velvet sofa in azure blue.',
                images: ['/images/hero.png'],
                brand: 'UrbanLiving',
                condition: 'new',
                specifications: { dimensions: '80x35x32 inches', material: 'Velvet, Teak Wood', color: 'Azure Blue', weight: '45kg', warranty: '1 Year' },
                rentalPlans: [
                    { duration: 3, label: '3 Months', monthlyPrice: 1500, totalPrice: 4500, discount: 0 },
                    { duration: 6, label: '6 Months', monthlyPrice: 1300, totalPrice: 7800, discount: 10, isPopular: true },
                    { duration: 12, label: '12 Months', monthlyPrice: 1100, totalPrice: 13200, discount: 20 }
                ],
                securityDeposit: 3000,
                availableUnits: 12,
                totalUnits: 15,
                isFeatured: true,
                tags: ['living-room', 'sofa', 'premium']
            },
            {
                name: 'Smart 4K Refrigerator 450L',
                slug: 'smart-fridge-450l',
                category: categories[3]._id,
                description: 'Energy-efficient double door refrigerator with smart cooling technology.',
                shortDescription: '450L Double Door Smart Refrigerator.',
                images: ['/images/appliances.png'],
                brand: 'Samsung',
                condition: 'new',
                specifications: { dimensions: '70x30x28 inches', material: 'Stainless Steel', color: 'Silver', weight: '85kg', warranty: '2 Years' },
                rentalPlans: [
                    { duration: 3, label: '3 Months', monthlyPrice: 2200, totalPrice: 6600, discount: 0 },
                    { duration: 6, label: '6 Months', monthlyPrice: 2000, totalPrice: 12000, discount: 5, isPopular: true },
                    { duration: 12, label: '12 Months', monthlyPrice: 1800, totalPrice: 21600, discount: 15 }
                ],
                securityDeposit: 5000,
                availableUnits: 8,
                totalUnits: 10,
                isFeatured: true,
                tags: ['appliances', 'kitchen', 'fridge']
            },
            {
                name: 'ErgoPro Height Adjustable Desk',
                slug: 'ergopro-adjustable-desk',
                category: categories[2]._id,
                description: 'Premium height adjustable desk for a healthy work-from-home setup.',
                shortDescription: 'Motorized height adjustable work desk.',
                images: ['/images/office.png'],
                brand: 'ErgoLife',
                condition: 'new',
                specifications: { dimensions: '48x24 inches', material: 'Engineered Wood, Steel', color: 'Oak/Black', weight: '30kg', warranty: '3 Years' },
                rentalPlans: [
                    { duration: 3, label: '3 Months', monthlyPrice: 1200, totalPrice: 3600, discount: 0 },
                    { duration: 6, label: '6 Months', monthlyPrice: 1000, totalPrice: 6000, discount: 10 },
                    { duration: 12, label: '12 Months', monthlyPrice: 850, totalPrice: 10200, discount: 25, isPopular: true }
                ],
                securityDeposit: 2500,
                availableUnits: 20,
                totalUnits: 25,
                tags: ['office', 'desk', 'ergonomic']
            }
            // ... adding more to reach 12
        ];

        // Fill up to 12 products
        const moreProducts = [
            { name: 'Queen Size Sheesham Bed', slug: 'sheesham-queen-bed', category: categories[1]._id, brand: 'SleepWell', securityDeposit: 4000, availableUnits: 10, totalUnits: 12 },
            { name: 'Front Load Washing Machine 8kg', slug: 'washing-machine-8kg', category: categories[3]._id, brand: 'LG', securityDeposit: 4500, availableUnits: 7, totalUnits: 10 },
            { name: 'Modern 4-Seater Dining Set', slug: 'dining-set-4', category: categories[5]._id, brand: 'HomeStyle', securityDeposit: 3500, availableUnits: 5, totalUnits: 8 },
            { name: 'Minimalist Study Chair', slug: 'study-chair', category: categories[2]._id, brand: 'IKEA', securityDeposit: 1000, availableUnits: 15, totalUnits: 20 },
            { name: '3-Door Wardrobe with Mirror', slug: 'wardrobe-3-door', category: categories[4]._id, brand: 'Nilkamal', securityDeposit: 3000, availableUnits: 9, totalUnits: 12 },
            { name: 'Cloud Comfort King Mattress', slug: 'king-mattress', category: categories[1]._id, brand: 'Wakefit', securityDeposit: 2000, availableUnits: 14, totalUnits: 18 },
            { name: 'Compact Microwave Oven 20L', slug: 'microwave-20l', category: categories[3]._id, brand: 'IFB', securityDeposit: 1500, availableUnits: 11, totalUnits: 15 },
            { name: 'Floor Lamp with Marble Base', slug: 'floor-lamp-marble', category: categories[6]._id, brand: 'DecoLight', securityDeposit: 800, availableUnits: 18, totalUnits: 20 },
            { name: 'Essential Home Starter Package', slug: 'home-starter-pkg', category: categories[7]._id, brand: 'RentEase', securityDeposit: 8000, availableUnits: 10, totalUnits: 12 }
        ].map(p => ({
            ...p,
            description: `${p.name} - high quality and reliable.`,
            shortDescription: `Premium ${p.name} for your home.`,
            condition: 'new',
            rentalPlans: [
                { duration: 3, label: '3 Months', monthlyPrice: 1000, totalPrice: 3000, discount: 0 },
                { duration: 6, label: '6 Months', monthlyPrice: 900, totalPrice: 5400, discount: 10 },
                { duration: 12, label: '12 Months', monthlyPrice: 800, totalPrice: 9600, discount: 20 }
            ],
            specifications: { material: 'High grade', warranty: '1 Year' }
        }));

        // 3. Create Users
        const usersData = [
            { name: 'Admin User', email: 'admin@rentease.com', phone: '9999999999', password: 'Admin@123', role: 'admin' },
            { name: 'Aditya Rao', email: 'user1@test.com', phone: '9876543210', password: 'Test@1234', address: { street: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500034' } },
            { name: 'Sana Khan', email: 'user2@test.com', phone: '8765432109', password: 'Test@1234', address: { street: 'Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033' } },
            { name: 'Vikram Singh', email: 'user3@test.com', phone: '7654321098', password: 'Test@1234', address: { street: 'Gachibowli', city: 'Hyderabad', state: 'Telangana', pincode: '500032' } },
            { name: 'Priya Reddy', email: 'user4@test.com', phone: '9123456780', password: 'Test@1234', address: { street: 'Kondapur', city: 'Hyderabad', state: 'Telangana', pincode: '500084' } },
            { name: 'Rohan Mehta', email: 'user5@test.com', phone: '9988776655', password: 'Test@1234', address: { street: 'Madhapur', city: 'Hyderabad', state: 'Telangana', pincode: '500081' } }
        ];
        const users = [];
        for(let u of usersData) {
            const user = new User(u);
            await user.save();
            users.push(user);
        }
        console.log('Seeded 6 Users.');

        // 4. Create Products
        const allProducts = await Product.create([...productsData, ...moreProducts].map(p => ({
            ...p,
            vendor: users[0]._id, // Assign the first user (Admin) as the vendor
            isApproved: true,     // Automatically approve seeded products
            isAvailable: true     // Make them available for rent
        })));
        console.log('Seeded 12 Products.');

        // 5. Create Orders
        const statuses = ['placed', 'confirmed', 'delivered', 'active', 'cancelled'];
        const orders = [];
        for (let i = 0; i < 10; i++) {
            const user = users[i % 5];
            const product = allProducts[i % 12];
            const plan = product.rentalPlans[1];
            const order = await Order.create({
                user: user._id,
                items: [{
                    product: product._id,
                    productName: product.name,
                    selectedPlan: plan,
                    quantity: 1,
                    securityDeposit: product.securityDeposit
                }],
                pricing: {
                    subtotal: plan.monthlyPrice,
                    totalDeposit: product.securityDeposit,
                    grandTotal: plan.monthlyPrice + product.securityDeposit
                },
                deliveryAddress: user.address,
                orderStatus: statuses[i % 5],
                paymentStatus: i % 2 === 0 ? 'paid' : 'pending',
                paymentMethod: 'upi'
            });
            orders.push(order);
        }
        console.log('Seeded 10 Orders.');

        // 6. Create Rentals
        const rentals = [];
        const activeOrders = orders.filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'active');
        for (let i = 0; i < Math.min(5, activeOrders.length); i++) {
            const order = activeOrders[i];
            const item = order.items[0];
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + item.selectedPlan.duration);
            
            const rental = await Rental.create({
                order: order._id,
                user: order.user,
                product: item.product,
                rentalPlan: item.selectedPlan,
                startDate,
                endDate,
                status: 'active',
                nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
            });
            rentals.push(rental);
        }
        console.log('Seeded 5 Rentals.');

        // 7. Create Maintenance Requests
        const ticketsData = [
            { issueType: 'malfunction', description: 'Washing machine making loud noise during spin cycle.', priority: 'high', status: 'submitted' },
            { issueType: 'damage', description: 'Minor scratch on the sofa leg during delivery.', priority: 'low', status: 'under-review' },
            { issueType: 'replacement', description: 'Requesting replacement for the study chair seat.', priority: 'medium', status: 'technician-assigned' }
        ];
        for (let i = 0; i < 3; i++) {
            const rental = rentals[i % rentals.length];
            await MaintenanceRequest.create({
                ...ticketsData[i],
                user: rental.user,
                rental: rental._id,
                product: rental.product
            });
        }
        console.log('Seeded 3 Tickets.');

        console.log(`\n✅ Success: Seeded 8 categories, 12 products, 2 admins, 5 users, 10 orders, 5 rentals, 3 tickets`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();

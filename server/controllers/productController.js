const Product = require('../models/Product');
const Category = require('../models/Category');
const sendResponse = require('../utils/sendResponse');

// @desc    Get all products with advanced filtering
// @route   GET /api/v1/products
exports.getProducts = async (req, res, next) => {
    try {
        const { 
            category, 
            search, 
            minPrice, 
            maxPrice, 
            condition, 
            sort, 
            featured, 
            available, 
            page = 1, 
            limit = 12 
        } = req.query;

        let query = { isApproved: true };

        // Search Filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Category Filter
        if (category) {
            const categoryDoc = await Category.findOne({ slug: category });
            if (categoryDoc) {
                query.category = categoryDoc._id;
            }
        }

        // Price Filter
        if (minPrice || maxPrice) {
            query['rentalPlans.0.monthlyPrice'] = {
                $gte: +minPrice || 0,
                $lte: +maxPrice || 99999
            };
        }

        // Condition Filter
        if (condition) {
            query.condition = { $in: condition.split(',') };
        }

        // Featured Filter
        if (featured === 'true') {
            query.isFeatured = true;
        }

        // Availability Filter
        if (available === 'true') {
            query.isAvailable = true;
            query.availableUnits = { $gt: 0 };
        }

        // Sort Map
        const sortMap = {
            'price-low': 'rentalPlans.0.monthlyPrice',
            'price-high': '-rentalPlans.0.monthlyPrice',
            'popular': '-ratings.count',
            'newest': '-createdAt'
        };
        const sortStr = sortMap[sort] || '-createdAt';

        // Pagination
        const skip = (page - 1) * limit;

        const products = await Product.find(query)
            .sort(sortStr)
            .skip(skip)
            .limit(+limit)
            .populate('category', 'name slug')
            .select('-__v');

        const total = await Product.countDocuments(query);

        sendResponse(res, 200, true, 'Products fetched successfully', {
            products,
            totalCount: total,
            totalPages: Math.ceil(total / limit),
            currentPage: +page,
            hasNextPage: +page * +limit < total
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single product by slug
// @route   GET /api/v1/products/:slug
exports.getProductBySlug = async (req, res, next) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug })
            .populate('category', 'name slug')
            .select('-__v');

        if (!product) {
            return sendResponse(res, 404, false, 'Product not found');
        }

        sendResponse(res, 200, true, 'Product fetched successfully', { product });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all active categories
// @route   GET /api/v1/products/categories/all
exports.getAllCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort('sortOrder')
            .select('-__v');

        sendResponse(res, 200, true, 'Categories fetched successfully', { categories });
    } catch (error) {
        next(error);
    }
};

// @desc    Global search for products and categories
// @route   GET /api/v1/products/search
// @access  Public
exports.globalSearch = async (req, res, next) => {
    try {
        const { q, type = 'all', limit = 8 } = req.query;
        if (!q || q.trim().length < 2) {
            return sendResponse(res, 400, false, 'Search query must be at least 2 characters');
        }

        const regex = new RegExp(q.trim(), 'i');
        
        const productSearchQuery = Product.find({
            isAvailable: true,
            $or: [
                { name: regex },
                { brand: regex },
                { tags: { $in: [regex] } },
                { shortDescription: regex }
            ]
        })
        .select('name slug images brand rentalPlans ratings')
        .populate('category', 'name slug')
        .limit(+limit);

        const categorySearchQuery = Category.find({
            isActive: true,
            $or: [
                { name: regex },
                { description: regex }
            ]
        })
        .select('name slug icon image')
        .limit(4);

        if (type === 'products') {
            const products = await productSearchQuery;
            return sendResponse(res, 200, true, 'Search results', { products, categories: [], query: q });
        }
        
        if (type === 'categories') {
            const categories = await categorySearchQuery;
            return sendResponse(res, 200, true, 'Search results', { products: [], categories, query: q });
        }

        const [products, categories] = await Promise.all([productSearchQuery, categorySearchQuery]);
        sendResponse(res, 200, true, 'Search results', { products, categories, query: q });
    } catch (error) {
        next(error);
    }
};

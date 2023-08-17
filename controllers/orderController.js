const Order = require('../models/order');
const Product = require('../models/product');


// Create a new order   =>  /api/v1/order/new
exports.newOrder = async (req, res, next) => {


    console.log(req.body , " this is order")
    const {
        quantity, 
        price, 
        name, 
        product,
        seller,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo
  
    } = req.body;

    const order = await Order.create({
        quantity, 
        price, 
        name, 
        product,
        shippingInfo,
        itemsPrice,
        taxPrice,
        seller,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user._id
    })

    res.status(200).json({
        success: true,
        order
    })
}


// Get single order   =>   /api/v1/order/:id
exports.getSingleOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email')

    if (!order) {
        return next(('No Order found with this ID', 404))
    }

    res.status(200).json({
        success: true,
        order
    })
}

// Get logged in user orders   =>   /api/v1/orders/me
exports.myOrders = async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id }) 


    res.status(200).json({
        success: true,
        orders
    })
}


// Get all orders - ADMIN  =>   /api/v1/admin/orders/
exports.allOrders = async (req, res, next) => {
    const orders = await Order.find()
    
    res.status(200).json({
        success: true,
        orders
    })
}

// Update / Process order - ADMIN  =>   /api/v1/admin/order/:id
exports.updateOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id)  

    const id  = order.product; 
    const quantity = order.quantity; 




     if (order.orderStatus === 'Delivered') {
        return next(('You have already delivered this order', 400))
    }

        await updateStock(id, quantity)


    order.orderStatus = req.body.status,
        order.deliveredAt = Date.now()

    await order.save()

    res.status(200).json({
        success: true,
    })
}

async function updateStock(id, quantity) {
    const product = await Product.findById(id);

    product.stock = product.stock - quantity;

    await product.save({ validateBeforeSave: false })
}

// Delete order   =>   /api/v1/admin/order/:id
exports.deleteOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id)

    if (!order) {
        return next(('No Order found with this ID', 404))
    }

    await order.remove()

    res.status(200).json({
        success: true
    })
}



// Get  logged in user/seller Orders => /api/v1/seller/orders 

exports.sellerOrders = async(req,res,next) => { 
    try { 
        const sellerOrders =  await Order.find({seller:req.user.id}); 

        res.status(200).json({ 
            success:true, 
            sellerOrders
        })


        console.log(sellerOrders, " thse are seller orders")
    } 
    catch( err)  { 
        console.log(err); 
    }
};


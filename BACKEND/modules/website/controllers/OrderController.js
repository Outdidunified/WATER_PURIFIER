const razorpay = require('../../../services/Razorpay');
const crypto = require('crypto');
const { connectToDatabase } = require('../../../config/db');
const { ObjectId } = require('mongodb');
const { sendSubscriptionConfirmationEmail } = require('../controllers/Email');


function generateOrderId() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // e.g. 20250526
    const random = Math.random().toString(36).substr(2, 6).toUpperCase(); // 6-char random
    return `ORD-${date}-${random}`;
}



exports.createSubscriptionOrder = async (req, res) => {
    try {
        const {
            productModelId,
            selectedPlanId,
            selectedDurationId,
            deliveryAddress,
            finalMonthlyPrice,
            discountAmount,
            gstAmount,
            securityDeposit,
            grandTotal,
            priceWithGST,
            totalLitre
        } = req.body;

        const db = await connectToDatabase();
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // ✅ Validate all required fields
        if (
            !productModelId || !selectedPlanId || !selectedDurationId || !deliveryAddress ||
            finalMonthlyPrice === undefined || discountAmount === undefined || priceWithGST === undefined ||
            gstAmount === undefined || grandTotal === undefined
        ) {
            return res.status(400).json({ message: 'All fields except securityDeposit are required' });
        }

        // ✅ Check if security deposit is required (only for new users)
        if (!user.security_deposit_added && (securityDeposit === undefined || securityDeposit === null)) {
            return res.status(400).json({ message: 'securityDeposit is required for new users' });
        }

        // ✅ BLOCK multiple active subscriptions for same product
        const now = new Date();
        const activeOrder = await db.collection('orders').findOne({
            user_id: user.user_id,
            productModelId: productModelId,
            paymentStatus: 'Completed',
            subscriptionExpiryDate: { $gte: now }
        });

        if (activeOrder) {
            return res.status(400).json({
                status: 'failed',
                message: 'You already have an active subscription for this product. Please wait until it expires before subscribing again.'
            });
        }

        // ✅ Fetch product model
        const productModel = await db.collection('product_models').findOne({ _id: new ObjectId(productModelId) });
        if (!productModel) return res.status(404).json({ message: 'Product model not found' });

        if (!productModel.wp_device_quantity || productModel.wp_device_quantity <= 0) {
            return res.status(404).json({ message: 'No available devices for this product model' });
        }

        // ✅ Get selected plan & duration
        const selectedPlan = productModel.plans.find(plan => plan.plans_id === selectedPlanId);
        const selectedDuration = productModel.duration.find(dur => dur.duration_id === selectedDurationId);
        if (!selectedPlan || !selectedDuration) {
            return res.status(404).json({ message: 'Selected plan or duration not found' });
        }

        // ✅ Get device available for the model
        const device = await db.collection('device_details').findOne({ model_id: Number(productModel.model_id), status: true });
        if (!device) return res.status(404).json({ message: 'Device not found for this model' });

        const effectiveSecurityDeposit = user.security_deposit_added ? 0 : securityDeposit;

        // ✅ Calculate payment amount
        const totalAmountForRazorpay = grandTotal - effectiveSecurityDeposit;

        // ✅ Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(totalAmountForRazorpay * 100), // in paise
            currency: 'INR',
            receipt: `order_rcptid_${Math.floor(Math.random() * 1000000)}`
        });

        const customOrderId = generateOrderId();

        // ✅ Prepare and insert order
        const newOrder = {
            customOrderId,
            user_id: user.user_id,
            productModelId,
            modelName: productModel.model_name,
            wp_device_id: device.wp_device_id,
            selectedPlan,
            selectedDuration,
            grandTotal: totalAmountForRazorpay,
            deliveryAddress,
            paymentStatus: 'Pending',
            orderStatus: 'Created',
            razorpayOrderId: razorpayOrder.id,
            totalLitre,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('orders').insertOne(newOrder);
        const orderId = result.insertedId;

        // ✅ Insert payment doc
        const paymentDoc = {
            user_id: user.user_id,
            orderId,
            razorpayOrderId: razorpayOrder.id,
            finalMonthlyPrice,
            discountAmount,
            priceWithGST,
            gstAmount,
            securityDeposit: effectiveSecurityDeposit,
            totalPrice: totalAmountForRazorpay,
            totalLitre,
            paymentStatus: 'Pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.collection('payments').insertOne(paymentDoc);

        // ✅ Generate signature for client-side validation
        const signatureBase = razorpayOrder.id + '|' + orderId.toString();
        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(signatureBase)
            .digest('hex');

        // ✅ Send success response
        return res.status(200).json({
            status: 'success',
            message: 'Order created and Razorpay payment initiated',
            data: {
                orderId: customOrderId,
                userId: user.user_id,
                razorpayOrder,
                razorpaySignature: generatedSignature,
                product: {
                    _id: productModel._id,
                    model_name: productModel.model_name
                },
                wp_device_id: device.wp_device_id,
                selectedPlan,
                selectedDuration,
                costBreakdown: {
                    finalMonthlyPrice,
                    discountAmount,
                    priceWithGST,
                    gstAmount,
                    securityDeposit: effectiveSecurityDeposit,
                    totalPrice: totalAmountForRazorpay
                },
                deliveryAddress,
                totalLitre
            }
        });

    } catch (err) {
        console.error('Error in createSubscriptionOrder:', err);
        return res.status(500).json({ message: 'Failed to create order', error: err.message });
    }
};





exports.verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'All fields are required for verification' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        const db = await connectToDatabase();
        const order = await db.collection('orders').findOne({ razorpayOrderId: razorpay_order_id });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const subscribedAt = new Date();
        const durationStr = order.selectedDuration?.duration_time_limit || '30 days';
        const durationInDays = parseInt(durationStr.split(' ')[0], 10) || 30;

        const userNewExpiry = new Date(subscribedAt);
        userNewExpiry.setDate(userNewExpiry.getDate() + durationInDays);

        const user = await db.collection('users').findOne({ user_id: order.user_id });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // ✅ Update Order
        await db.collection('orders').updateOne(
            { _id: order._id },
            {
                $set: {
                    paymentStatus: 'Completed',
                    orderStatus: 'Confirmed',
                    razorpayPaymentId: razorpay_payment_id,
                    updatedAt: new Date(),
                    subscriptionExpiryDate: userNewExpiry
                }
            }
        );

        // ✅ Update Payment
        await db.collection('payments').updateOne(
            { razorpayOrderId: razorpay_order_id },
            {
                $set: {
                    paymentStatus: 'Completed',
                    razorpayPaymentId: razorpay_payment_id,
                    subscribedAt,
                    subscriptionExpiryDate: userNewExpiry,
                    updatedAt: new Date()
                }
            }
        );

        // ✅ Prepare User Update Payload
        const userUpdatePayload = {
            is_subscribed: true,
            subscribed_at: subscribedAt,
            subscription_expiry_date: userNewExpiry,
            active_label: order.selectedPlan?.label || null,
            active_plan_id: order.selectedPlan?.plans_id || null,
            active_duration_id: order.selectedDuration?.duration_time_limit || null,
            active_order_id: order._id.toString()
        };

        const securityDeposit = order.selectedDuration?.security_deposit || 0;

        if (!user.security_deposit_added && securityDeposit > 0) {
            userUpdatePayload.security_deposit = securityDeposit;
            userUpdatePayload.security_deposit_added = true;
        }

        // ✅ Update User (set and add to array, and unset old single device field)
        await db.collection('users').updateOne(
            { user_id: order.user_id },
            {
                $set: userUpdatePayload,
                $addToSet: { assigned_device_ids: order.wp_device_id || null },
                $unset: { assigned_device_id: "" } // 🔥 remove old field
            }
        );

        // ✅ Update Product Model Quantity
        if (order.productModelId) {
            const productModel = await db.collection('product_models').findOne({ _id: new ObjectId(order.productModelId) });

            if (!productModel) {
                return res.status(404).json({ message: 'Product model not found' });
            }

            let currentQty = productModel.wp_device_quantity;

            if (typeof currentQty === 'string') {
                currentQty = parseInt(currentQty, 10);
                if (isNaN(currentQty)) {
                    return res.status(500).json({ message: 'Invalid device quantity' });
                }
                await db.collection('product_models').updateOne(
                    { _id: new ObjectId(order.productModelId) },
                    { $set: { wp_device_quantity: currentQty } }
                );
            }

            if (typeof currentQty === 'number' && currentQty > 0) {
                await db.collection('product_models').updateOne(
                    { _id: new ObjectId(order.productModelId) },
                    { $inc: { wp_device_quantity: -1 } }
                );
            } else {
                return res.status(400).json({ message: 'Device quantity is zero or invalid' });
            }
        }

        // ✅ Send Subscription Email
        try {
            await sendSubscriptionConfirmationEmail(user, order, userNewExpiry);
        } catch (emailError) {
            console.error('Error sending subscription confirmation email:', emailError);
        }

        return res.status(200).json({
            status: 'success',
            message: 'Payment verified and subscription activated',
            subscriptionExpiryDate: userNewExpiry
        });

    } catch (error) {
        console.error('Error verifying Razorpay payment:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};



// GET /api/recharge-history
exports.getRechargeHistory = async (req, res) => {
    try {
        const db = await connectToDatabase();

        // Find the user by req.userId
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch all orders for the user
        const orders = await db.collection('orders')
            .find({ user_id: user.user_id })
            .sort({ createdAt: -1 })
            .toArray();

        if (!orders.length) {
            return res.status(200).json({
                status: 'success',
                message: 'No subscription history found',
                orders: []
            });
        }

        // Combine orders with relevant payment details (excluding duplicates)
        const ordersWithPayments = await Promise.all(
            orders.map(async (order) => {
                const payment = await db.collection('payments').findOne({
                    razorpayOrderId: order.razorpayOrderId
                });

                let cleanedPaymentDetails = null;

                if (payment) {
                    const {
                        baseRent,
                        discount,
                        discountedBaseRent,
                        gstAmount,
                        securityDeposit,
                        subscribedAt,
                        subscriptionExpiryDate
                    } = payment;

                    cleanedPaymentDetails = {
                        baseRent,
                        discount,
                        discountedBaseRent,
                        gstAmount,
                        securityDeposit,
                        subscribedAt,
                        subscriptionExpiryDate
                    };
                }

                return {
                    ...order,
                    paymentDetails: cleanedPaymentDetails
                };
            })
        );

        res.status(200).json({
            status: 'success',
            message: 'User subscription history fetched successfully',
            orders: ordersWithPayments
        });

    } catch (error) {
        console.error('Error fetching recharge history:', error);
        res.status(500).json({ message: 'Failed to fetch subscription history', error: error.message });
    }
};






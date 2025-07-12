import 'package:aquapulse_app/feature/end_user_app/settings/presentation/controllers/settings_controller.dart';
import 'package:aquapulse_app/utils/widgets/error/error_display_widget.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:get/get.dart';
import 'package:shimmer/shimmer.dart';

// Custom painter for dashed divider
class DashedLinePainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double dashWidth;
  final double dashSpace;

  DashedLinePainter({
    required this.color,
    required this.strokeWidth,
    required this.dashWidth,
    required this.dashSpace,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    double startX = 0;
    final y = size.height / 2;

    while (startX < size.width) {
      canvas.drawLine(
        Offset(startX, y),
        Offset(startX + dashWidth, y),
        paint,
      );
      startX += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class SubscriptionPlanPage extends StatelessWidget {
  const SubscriptionPlanPage({super.key});

  Widget _buildShimmerLoading(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return ListView.separated(
      padding: EdgeInsets.symmetric(
        vertical: screenHeight * 0.02,
        horizontal: screenWidth * 0.04,
      ),
      itemCount:
          2, // Show 2 shimmer placeholders to simulate multiple subscriptions
      itemBuilder: (context, index) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Shimmer for Subscription Card
            Shimmer.fromColors(
              baseColor: Colors.grey[300]!,
              highlightColor: Colors.grey[100]!,
              child: Container(
                padding: EdgeInsets.all(screenWidth * 0.04),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Model Name and Order Status
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          width: screenWidth * 0.4,
                          height: screenWidth * 0.05,
                          color: Colors.grey,
                        ),
                        Container(
                          width: screenWidth * 0.2,
                          height: screenWidth * 0.04,
                          decoration: BoxDecoration(
                            color: Colors.grey,
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: screenWidth * 0.02),
                    // Plan Details
                    Container(
                      width: screenWidth * 0.6,
                      height: screenWidth * 0.04,
                      color: Colors.grey,
                    ),
                    SizedBox(height: screenWidth * 0.01),
                    // Duration
                    Container(
                      width: screenWidth * 0.5,
                      height: screenWidth * 0.04,
                      color: Colors.grey,
                    ),
                    SizedBox(height: screenWidth * 0.01),
                    // Total Price
                    Container(
                      width: screenWidth * 0.4,
                      height: screenWidth * 0.04,
                      color: Colors.grey,
                    ),
                    SizedBox(height: screenWidth * 0.01),
                    // Expiry Date with Down Arrow
                    Row(
                      children: [
                        Container(
                          width: screenWidth * 0.3,
                          height: screenWidth * 0.04,
                          color: Colors.grey,
                        ),
                        SizedBox(width: screenWidth * 0.02),
                        Container(
                          width: screenWidth * 0.04,
                          height: screenWidth * 0.04,
                          color: Colors.grey,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            // Shimmer for Delivery Address Section
            SizedBox(height: screenHeight * 0.03),
            Shimmer.fromColors(
              baseColor: Colors.grey[300]!,
              highlightColor: Colors.grey[100]!,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: screenWidth * 0.4,
                    height: screenWidth * 0.05,
                    color: Colors.grey,
                  ),
                  SizedBox(height: screenHeight * 0.01),
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.all(screenWidth * 0.04),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: screenWidth * 0.5,
                          height: screenWidth * 0.04,
                          color: Colors.grey,
                        ),
                        SizedBox(height: screenWidth * 0.01),
                        Container(
                          width: screenWidth * 0.3,
                          height: screenWidth * 0.035,
                          color: Colors.grey,
                        ),
                        SizedBox(height: screenWidth * 0.01),
                        Container(
                          width: screenWidth * 0.7,
                          height: screenWidth * 0.035,
                          color: Colors.grey,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
      separatorBuilder: (context, index) => Padding(
        padding: EdgeInsets.symmetric(vertical: screenHeight * 0.01),
        child: CustomPaint(
          painter: DashedLinePainter(
            color: Colors.grey.shade300,
            strokeWidth: 1,
            dashWidth: 5,
            dashSpace: 3,
          ),
          child: const SizedBox(
            height: 1,
            width: double.infinity,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final settingsController = Get.find<SettingsController>();
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Subscription Plan'),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
      ),
      body: Obx(() {
        if (settingsController.isLoading.value) {
          return _buildShimmerLoading(context);
        } else if (settingsController.errorMessage.isNotEmpty) {
          return Center(
            child: ErrorDisplayWidget(
              errorMessage: settingsController.errorMessage.value,
              onRetry: () {
                settingsController.fetchUserDetails();
              },
            ),
          );
        }

        final now = DateTime.now();
        final activeSubscriptions = settingsController.paymentHistoryList
            .where((payment) =>
                payment.paymentStatus?.toLowerCase() == 'completed' &&
                payment.subscriptionExpiryDate != null &&
                payment.subscriptionExpiryDate!.isAfter(now))
            .toList();

        if (activeSubscriptions.isEmpty) {
          return Center(
            child: DisplayWidget(
              errorMessage: "No active subscription found.",
              assetPath: 'assets/icons/subscription_not_found.png',
            ),
          );
        }

        activeSubscriptions.sort((a, b) => b.createdAt.compareTo(a.createdAt));

        if (settingsController.deliveryAddressVisibility.length !=
            activeSubscriptions.length) {
          settingsController.deliveryAddressVisibility.value =
              List<bool>.filled(activeSubscriptions.length, false);
        }

        return ListView.separated(
          padding: EdgeInsets.symmetric(
            vertical: screenHeight * 0.02,
            horizontal: screenWidth * 0.04,
          ),
          itemCount: activeSubscriptions.length,
          itemBuilder: (context, index) {
            final subscription = activeSubscriptions[index];
            final order = subscription.orders.isNotEmpty
                ? subscription.orders.first
                : null;

            if (order == null) {
              return Container(
                padding: EdgeInsets.all(screenWidth * 0.04),
                margin: EdgeInsets.only(bottom: screenHeight * 0.02),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: const Text(
                  'No order details found for this subscription.',
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () {
                    settingsController.toggleDeliveryAddressVisibility(index);
                  },
                  child: Container(
                    padding: EdgeInsets.all(screenWidth * 0.04),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          Color.fromARGB(255, 241, 239, 239),
                          Color.fromARGB(255, 241, 239, 239),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.grey.withOpacity(0.2),
                          spreadRadius: 2,
                          blurRadius: 5,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              order.modelName ?? 'Unknown Model',
                              style: TextStyle(
                                fontSize: screenWidth * 0.05,
                                fontWeight: FontWeight.bold,
                                color: theme.colorScheme.primary,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: (order.orderStatus == 'Confirmed' ||
                                        order.orderStatus == 'Shipped')
                                    ? Colors.green.withOpacity(0.1)
                                    : Colors.orange.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                order.orderStatus ?? 'Unknown',
                                style: TextStyle(
                                  fontSize: screenWidth * 0.035,
                                  color: (order.orderStatus == 'Confirmed' ||
                                          order.orderStatus == 'Shipped')
                                      ? Colors.green
                                      : Colors.orange,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: screenWidth * 0.02),
                        Text(
                          'Plan: ${order.selectedPlan.label ?? 'N/A'} (${order.selectedPlan.capacity ?? 'N/A'})',
                          style: TextStyle(
                            fontSize: screenWidth * 0.04,
                            color: Colors.black87,
                          ),
                        ),
                        SizedBox(height: screenWidth * 0.01),
                        Text(
                          'Duration: ${order.selectedDuration.durationTimeLimit ?? 'N/A'}',
                          style: TextStyle(
                            fontSize: screenWidth * 0.04,
                            color: Colors.black87,
                          ),
                        ),
                        SizedBox(height: screenWidth * 0.01),
                        Text(
                          'Total Price: ₹${subscription.totalPrice?.toStringAsFixed(2) ?? '0.00'}',
                          style: TextStyle(
                            fontSize: screenWidth * 0.04,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                        ),
                        SizedBox(height: screenWidth * 0.01),
                        Row(
                          children: [
                            Text(
                              'Expires On: ${subscription.subscriptionExpiryDate != null ? DateFormat('dd MMM yyyy').format(subscription.subscriptionExpiryDate!) : 'N/A'}',
                              style: TextStyle(
                                fontSize: screenWidth * 0.04,
                                color: Colors.black54,
                              ),
                            ),
                            SizedBox(width: screenWidth * 0.02),
                            Icon(
                              settingsController
                                      .deliveryAddressVisibility[index]
                                  ? Icons.keyboard_arrow_up
                                  : Icons.keyboard_arrow_down,
                              size: screenWidth * 0.04,
                              color: Colors.black54,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                AnimatedSize(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                  child: settingsController.deliveryAddressVisibility[index]
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(height: screenHeight * 0.03),
                            Text(
                              'Delivery Address',
                              style: TextStyle(
                                fontSize: screenWidth * 0.05,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            SizedBox(height: screenHeight * 0.01),
                            Container(
                              width: screenHeight + (screenWidth * 0.08),
                              padding: EdgeInsets.all(screenWidth * 0.04),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey.shade300),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    order.deliveryAddress.name ?? 'N/A',
                                    style: TextStyle(
                                      fontSize: screenWidth * 0.04,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  SizedBox(height: screenWidth * 0.01),
                                  Text(
                                    order.deliveryAddress.phone ?? 'N/A',
                                    style: TextStyle(
                                      fontSize: screenWidth * 0.035,
                                      color: Colors.black54,
                                    ),
                                  ),
                                  SizedBox(height: screenWidth * 0.01),
                                  Text(
                                    '${order.deliveryAddress.addressLine1 ?? 'N/A'}, ${order.deliveryAddress.city ?? 'N/A'}, ${order.deliveryAddress.state ?? 'N/A'} - ${order.deliveryAddress.pincode ?? 'N/A'}',
                                    style: TextStyle(
                                      fontSize: screenWidth * 0.035,
                                      color: Colors.black54,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        )
                      : const SizedBox.shrink(),
                ),
              ],
            );
          },
          separatorBuilder: (context, index) => Padding(
            padding: EdgeInsets.symmetric(vertical: screenHeight * 0.01),
            child: CustomPaint(
              painter: DashedLinePainter(
                color: Colors.grey.shade300,
                strokeWidth: 1,
                dashWidth: 5,
                dashSpace: 3,
              ),
              child: const SizedBox(
                height: 1,
                width: double.infinity,
              ),
            ),
          ),
        );
      }),
    );
  }
}

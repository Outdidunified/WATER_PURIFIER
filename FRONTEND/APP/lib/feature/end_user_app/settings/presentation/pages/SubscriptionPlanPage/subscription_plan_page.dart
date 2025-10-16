import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/controllers/settings_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/data/urls.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/presentation/controllers/subscription_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/presentation/controllers/telemetry_controller.dart';
import 'package:ionhive_water_purifier/utils/widgets/error/error_display_widget.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:get/get.dart';
import 'package:shimmer/shimmer.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'package:open_file/open_file.dart';

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

  Widget _buildInfoChip(
    BuildContext context, {
    required String label,
    required String value,
    required IconData icon,
    Color? valueColor,
  }) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: screenWidth * 0.035,
        vertical: screenWidth * 0.02,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: theme.colorScheme.primary, size: screenWidth * 0.04),
          SizedBox(width: screenWidth * 0.02),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: screenWidth * 0.028,
                  color: Colors.black54,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: screenWidth * 0.034,
                  color: valueColor ?? Colors.black87,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _downloadInvoice(String orderId) async {
    if (orderId.isEmpty) {
      Get.snackbar('Error', 'Invalid order ID');
      return;
    }

    Get.snackbar('Downloading', 'Downloading invoice...', duration: Duration(seconds: 2));

    try {
      final url = '${SettingsUrl.downloadInvoice.url}$orderId/invoice';
      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        final directory = await getApplicationDocumentsDirectory();
        final filePath = '${directory.path}/invoice_$orderId.pdf';
        final file = File(filePath);
        await file.writeAsBytes(response.bodyBytes);

        // Try to open the PDF
        await OpenFile.open(filePath);
        Get.snackbar('Success', 'Invoice downloaded successfully');
      } else {
        Get.snackbar('Error', 'Failed to download invoice: ${response.statusCode}');
      }
    } catch (e) {
      Get.snackbar('Error', 'Error downloading invoice: ${e.toString().length > 50 ? e.toString().substring(0, 50) + '...' : e.toString()}');
    }
  }

  @override
  Widget build(BuildContext context) {
    Get.lazyPut(() => SubscriptionListController());
    final settingsController = Get.find<SettingsController>();
    final subscriptionController = Get.find<SubscriptionListController>();
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
        if (subscriptionController.isLoading.value) {
          return _buildShimmerLoading(context);
        } else if (subscriptionController.errorMessage.isNotEmpty) {
          return Center(
            child: ErrorDisplayWidget(
              errorMessage: subscriptionController.errorMessage.value,
              onRetry: () {
                subscriptionController.fetchOrders();
              },
            ),
          );
        }

        final activeSubscriptions = subscriptionController.orders;

        if (activeSubscriptions.isEmpty) {
          return Center(
            child: DisplayWidget(
              errorMessage: "No active subscription found.",
              assetPath: 'assets/icons/subscription_not_found.png',
            ),
          );
        }

        activeSubscriptions.sort((a, b) => DateTime.parse(b.createdAt).compareTo(DateTime.parse(a.createdAt)));

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
            final order = activeSubscriptions[index];

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
                      color: const Color.fromARGB(255, 241, 239, 239),
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
                        /// --- Header: Model + Status
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
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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

                        /// --- Basic Info (Plan, Duration, Price, Expiry)
                        Text(
                          'Plan: ${order.selectedPlan.label ?? 'N/A'} (${order.selectedPlan.capacity ?? 'N/A'})',
                          style: TextStyle(fontSize: screenWidth * 0.04, color: Colors.black87),
                        ),
                        SizedBox(height: screenWidth * 0.01),
                        Text(
                          'Duration: ${order.selectedDuration.durationTimeLimit ?? 'N/A'}',
                          style: TextStyle(fontSize: screenWidth * 0.04, color: Colors.black87),
                        ),
                        SizedBox(height: screenWidth * 0.01),
                        Text(
                          'Total Price: ₹${order.price.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: screenWidth * 0.04,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                        ),
                        SizedBox(height: screenWidth * 0.02),
                        
                        /// --- View Details Button
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Text(
                              'View Details',
                              style: TextStyle(
                                fontSize: screenWidth * 0.035,
                                color: theme.colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            SizedBox(width: screenWidth * 0.01),
                            Icon(
                              settingsController.deliveryAddressVisibility[index]
                                  ? Icons.keyboard_arrow_up
                                  : Icons.keyboard_arrow_down,
                              size: screenWidth * 0.04,
                              color: theme.colorScheme.primary,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                /// --- Expandable Details Section
                AnimatedSize(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                  child: settingsController.deliveryAddressVisibility[index]
                      ? Padding(
                          padding: EdgeInsets.only(top: screenHeight * 0.02),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              /// --- Delivery Address Section
                              Text(
                                'Delivery Address',
                                style: TextStyle(
                                  fontSize: screenWidth * 0.045,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
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
                                      '${order.deliveryAddress.street ?? 'N/A'}${order.deliveryAddress.landmark != null && order.deliveryAddress.landmark!.isNotEmpty ? ', ${order.deliveryAddress.landmark}' : ''}, ${order.deliveryAddress.city ?? 'N/A'}, ${order.deliveryAddress.state ?? 'N/A'} - ${order.deliveryAddress.pincode ?? 'N/A'}',
                                      style: TextStyle(
                                        fontSize: screenWidth * 0.035,
                                        color: Colors.black54,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              
                              /// --- Expires On
                              Padding(
                                padding: EdgeInsets.only(top: screenHeight * 0.02),
                                child: Text(
                                  'Expires On: ${order.subscriptionExpiryDate.isNotEmpty ? DateFormat('dd MMM yyyy').format(DateTime.parse(order.subscriptionExpiryDate)) : 'N/A'}',
                                  style: TextStyle(
                                    fontSize: screenWidth * 0.04,
                                    color: Colors.black54,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              
                              /// --- Payment Details Section
                              Padding(
                                padding: EdgeInsets.only(top: screenHeight * 0.03),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Payment Details',
                                      style: TextStyle(
                                        fontSize: screenWidth * 0.045,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black87,
                                      ),
                                    ),
                                    SizedBox(height: screenHeight * 0.01),
                                    
                                    /// --- Two-column Info Boxes
                                    GridView.count(
                                      physics: const NeverScrollableScrollPhysics(),
                                      shrinkWrap: true,
                                      crossAxisCount: 2,
                                      crossAxisSpacing: screenWidth * 0.03,
                                      mainAxisSpacing: screenWidth * 0.02,
                                      childAspectRatio: 2.6,
                                      children: [
                                        _buildInfoChip(
                                          context,
                                          label: 'Payment Type',
                                          value: order.paymentStatus.toLowerCase() == 'cod' ? 'COD' : 'Online',
                                          icon: Icons.atm,
                                        ),
                                        _buildInfoChip(
                                          context,
                                          label: 'Payment Status',
                                          value: order.paymentStatus,
                                          icon: Icons.payments,
                                          valueColor: order.paymentStatus.toLowerCase() == 'completed'
                                              ? Colors.green
                                              : Colors.orange,
                                        ),
                                        _buildInfoChip(
                                          context,
                                          label: 'Grand Total',
                                          value: '₹${order.price.toStringAsFixed(2)}',
                                          icon: Icons.account_balance_wallet,
                                        ),
                                        _buildInfoChip(
                                          context,
                                          label: 'GST',
                                          value: '${order.selectedDuration.gst}%',
                                          icon: Icons.percent,
                                        ),
                                        _buildInfoChip(
                                          context,
                                          label: 'Security Deposit',
                                          value: '₹${order.selectedDuration.securityDeposit}',
                                          icon: Icons.security,
                                        ),
                                        _buildInfoChip(
                                          context,
                                          label: 'Discount',
                                          value: '${order.selectedDuration.discount}%',
                                          icon: Icons.local_offer,
                                        ),
                                      ],
                                    ),
                                    
                                    /// --- Download Button (Only show if payment is confirmed/completed)
                                    if (order.paymentStatus.toLowerCase() == 'confirmed' || 
                                        order.paymentStatus.toLowerCase() == 'completed') ...[
                                      SizedBox(height: screenWidth * 0.03),
                                      Align(
                                        alignment: Alignment.centerRight,
                                        child: ElevatedButton.icon(
                                          onPressed: () => _downloadInvoice(order.customOrderId),
                                          icon: Icon(Icons.download, size: screenWidth * 0.04),
                                          label: Text(
                                            'Download Invoice',
                                            style: TextStyle(fontSize: screenWidth * 0.035),
                                          ),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: theme.colorScheme.primary,
                                            foregroundColor: theme.colorScheme.onPrimary,
                                            padding: EdgeInsets.symmetric(
                                              horizontal: screenWidth * 0.04,
                                              vertical: screenWidth * 0.02,
                                            ),
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(8.0),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
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

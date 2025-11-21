import 'package:ionhive_water_purifier/feature/end_user_app/settings/data/urls.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/presentation/controllers/subscription_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/controllers/settings_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/presentation/controllers/telemetry_controller.dart';
import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';
import 'package:ionhive_water_purifier/utils/widgets/error/error_display_widget.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/models/home_model.dart';
import 'package:ionhive_water_purifier/utils/widgets/webview_screen.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:get/get.dart';
import 'package:shimmer/shimmer.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'dart:convert';
import 'dart:io';
import 'package:open_file/open_file.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

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
          2,
      itemBuilder: (context, index) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Shimmer.fromColors(
              baseColor: Colors.grey[300]!,
              highlightColor: Colors.grey[100]!,
              child: Container(
                padding: EdgeInsets.all(screenWidth * 0.04),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
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
                    Container(
                      width: screenWidth * 0.6,
                      height: screenWidth * 0.04,
                      color: Colors.grey,
                    ),
                    SizedBox(height: screenWidth * 0.01),
                    Container(
                      width: screenWidth * 0.5,
                      height: screenWidth * 0.04,
                      color: Colors.grey,
                    ),
                    SizedBox(height: screenWidth * 0.01),
                    Container(
                      width: screenWidth * 0.4,
                      height: screenWidth * 0.04,
                      color: Colors.grey,
                    ),
                    SizedBox(height: screenWidth * 0.01),
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
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Colors.grey.shade300, width: 1),
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

        await OpenFile.open(filePath);
        Get.snackbar('Success', 'Invoice downloaded successfully');
      } else {
        Get.snackbar('Error', 'Failed to download invoice: ${response.statusCode}');
      }
    } catch (e) {
      Get.snackbar('Error', 'Error downloading invoice: ${e.toString().length > 50 ? e.toString().substring(0, 50) + '...' : e.toString()}');
    }
  }

  void _showDetailsBottomSheet(BuildContext context, Order order) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black54,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.75,
          minChildSize: 0.6,
          maxChildSize: 0.95,
          builder: (context, scrollController) => Column(
            children: [
              Padding(
                padding: EdgeInsets.only(top: screenHeight * 0.015),
                child: Center(
                  child: Container(
                    width: screenWidth * 0.1,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade400,
                      borderRadius: BorderRadius.circular(2.5),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Padding(
                    padding: EdgeInsets.all(screenWidth * 0.04),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Center(
                          child: Text(
                            'Order Details',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: screenWidth * 0.042,
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ),
                        SizedBox(height: screenHeight * 0.02),



                        Text(
                          'Delivery Address',
                          style: TextStyle(
                            fontSize: screenWidth * 0.039,
                            fontWeight: FontWeight.w400,
                            color: Colors.black87,
                          ),
                        ),
                        SizedBox(height: screenHeight * 0.01),
                        Container(
                          width: double.infinity,
                          padding: EdgeInsets.all(screenWidth * 0.04),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(8),
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

                        if (order.deliveryHistory.isNotEmpty) ...[
                          Padding(
                            padding: EdgeInsets.only(top: screenHeight * 0.025),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Delivery Status',
                                  style: TextStyle(
                                    fontSize: screenWidth * 0.039,
                                    fontWeight: FontWeight.w400,
                                    color: Colors.black87,
                                  ),
                                ),
                                SizedBox(height: screenHeight * 0.015),
                                ListView.separated(
                                  physics: const NeverScrollableScrollPhysics(),
                                  shrinkWrap: true,
                                  itemCount: order.deliveryHistory.length,
                                  separatorBuilder: (context, index) {
                                    if (index < order.deliveryHistory.length - 1) {
                                      return Container(
                                        margin: EdgeInsets.symmetric(vertical: screenHeight * 0.008),
                                        child: Row(
                                          children: [
                                            SizedBox(width: screenWidth * 0.055),
                                            Container(
                                              width: 1.5,
                                              height: screenHeight * 0.02,
                                              color: Colors.grey.shade300,
                                            ),
                                          ],
                                        ),
                                      );
                                    }
                                    return SizedBox.shrink();
                                  },
                                  itemBuilder: (context, index) {
                                    final history = order.deliveryHistory[index];
                                    final statusLower = history.status.toLowerCase();

                                    Color circleColor;
                                    IconData iconData;
                                    if (statusLower.contains('completed') || statusLower.contains('accepted')) {
                                      circleColor = Colors.green.shade500;
                                      iconData = Icons.check_circle;
                                    } else if (statusLower.contains('intransit') || statusLower.contains('outfordelivery') || statusLower.contains('packed')) {
                                      circleColor = Colors.blue.shade500;
                                      iconData = Icons.local_shipping;
                                    } else {
                                      circleColor = Colors.orange.shade400;
                                      iconData = Icons.schedule;
                                    }

                                    DateTime? parsedTime;
                                    try {
                                      parsedTime = DateTime.parse(history.timestamp).toLocal();
                                    } catch (e) {
                                      debugPrint('Error parsing timestamp: ${history.timestamp}');
                                    }
                                    final formattedTime = parsedTime != null
                                        ? DateFormat('dd MMM, hh:mm a').format(parsedTime)
                                        : history.timestamp;

                                    return Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          width: screenWidth * 0.09,
                                          height: screenWidth * 0.09,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: circleColor.withOpacity(0.15),
                                            border: Border.all(
                                              color: circleColor,
                                              width: 2,
                                            ),
                                          ),
                                          child: Center(
                                            child: Icon(
                                              iconData,
                                              color: circleColor,
                                              size: screenWidth * 0.045,
                                            ),
                                          ),
                                        ),
                                        SizedBox(width: screenWidth * 0.03),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                history.status.replaceAll(RegExp(r'([a-z])([A-Z])'), r'$1 $2').toUpperCase(),
                                                style: TextStyle(
                                                  fontSize: screenWidth * 0.032,
                                                  fontWeight: FontWeight.w600,
                                                  color: Colors.black87,
                                                ),
                                              ),
                                              SizedBox(height: screenWidth * 0.008),
                                              Text(
                                                formattedTime,
                                                style: TextStyle(
                                                  fontSize: screenWidth * 0.028,
                                                  color: Colors.black54,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],

                        Padding(
                          padding: EdgeInsets.only(top: screenHeight * 0.03),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Payment Details',
                                style: TextStyle(
                                  fontSize: screenWidth * 0.039,
                                  fontWeight: FontWeight.w400,
                                  color: Colors.black87,
                                ),
                              ),
                              SizedBox(height: screenHeight * 0.01),

                              Container(
                                width: double.infinity,
                                padding: EdgeInsets.all(screenWidth * 0.04),
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.primary.withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Payment Status',
                                              style: TextStyle(
                                                fontSize: screenWidth * 0.03,
                                                color: Colors.black54,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            SizedBox(height: screenWidth * 0.01),
                                            Text(
                                              order.paymentStatus,
                                              style: TextStyle(
                                                fontSize: screenWidth * 0.04,
                                                fontWeight: FontWeight.w700,
                                                color: order.paymentStatus.toLowerCase() == 'completed'
                                                    ? Colors.green
                                                    : order.paymentStatus.toLowerCase() == 'confirmed'
                                                    ? Colors.green
                                                    : Colors.orange,
                                              ),
                                            ),
                                          ],
                                        ),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Text(
                                              'Total Amount',
                                              style: TextStyle(
                                                fontSize: screenWidth * 0.03,
                                                color: Colors.black54,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            SizedBox(height: screenWidth * 0.01),
                                            Text(
                                              '₹${order.grandTotal.toStringAsFixed(2)}',
                                              style: TextStyle(
                                                fontSize: screenWidth * 0.04,
                                                fontWeight: FontWeight.w700,
                                                color: theme.colorScheme.primary,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: screenWidth * 0.03),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'Payment Type',
                                          style: TextStyle(
                                            fontSize: screenWidth * 0.03,
                                            color: Colors.black54,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        Container(
                                          padding: EdgeInsets.symmetric(
                                            horizontal: screenWidth * 0.04,
                                            vertical: screenWidth * 0.015,
                                          ),
                                          decoration: BoxDecoration(
                                            color: theme.colorScheme.primary.withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            order.paymentType ?? 'N/A',
                                            style: TextStyle(
                                              fontSize: screenWidth * 0.035,
                                              fontWeight: FontWeight.w700,
                                              color: theme.colorScheme.primary,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              SizedBox(height: screenHeight * 0.02),

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
                                    label: 'GST',
                                    value: '${order.selectedDuration.gst}%',
                                    icon: Icons.percent,
                                  ),
                                  _buildInfoChip(
                                    context,
                                    label: 'Discount',
                                    value: '${order.selectedDuration.discount}%',
                                    icon: Icons.local_offer,
                                  ),
                                  _buildInfoChip(
                                    context,
                                    label: 'Security Deposit',
                                    value: '₹${order.selectedDuration.securityDeposit}',
                                    icon: Icons.security,
                                  ),
                                  _buildInfoChip(
                                    context,
                                    label: 'COD Fee',
                                    value: '₹${order.codFee}',
                                    icon: Icons.atm,
                                  ),
                                ],
                              ),

                              if (order.tasks.isNotEmpty) ...[
                                SizedBox(height: screenWidth * 0.03),
                                _buildInstallationServiceStatusSection(
                                  context,
                                  order: order,
                                ),
                              ] else ...[
                                SizedBox(height: screenWidth * 0.03),
                                Text(
                                  'Installation Status',
                                  style: TextStyle(
                                    fontSize: screenWidth * 0.032,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                                ),
                                SizedBox(height: screenHeight * 0.01),
                                Container(
                                  width: double.infinity,
                                  padding: EdgeInsets.all(screenWidth * 0.04),
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.primary.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    order.installationStatus ?? 'Pending',
                                    style: TextStyle(
                                      fontSize: screenWidth * 0.04,
                                      fontWeight: FontWeight.w600,
                                      color: (order.installationStatus ?? 'Pending').toLowerCase() == 'completed'
                                          ? Colors.green
                                          : (order.installationStatus ?? 'Pending').toLowerCase() == 'in progress'
                                          ? Colors.orange
                                          : Colors.blue,
                                    ),
                                  ),
                                ),
                              ],

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
                        SizedBox(height: screenHeight * 0.02),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInstallationServiceStatusSection(
    BuildContext context, {
    required Order order,
  }) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Installation, Service & Recharge',
          style: TextStyle(
            fontSize: screenWidth * 0.039,
            fontWeight: FontWeight.w400,
            color: Colors.black87,
          ),
        ),
        SizedBox(height: screenHeight * 0.01),
        Column(
          children: order.tasks.map((task) {
            final statusColor = _getStatusColor(task.taskStatus);
            final isCompleted = task.taskStatus.toLowerCase() == 'completed';
            final isInProgress = task.taskStatus.toLowerCase() == 'in progress';
            final taskTitle = _getTaskTitle(task.taskType);
            final taskIcon = _getTaskIcon(task.taskType);
            final badgeText = _getBadgeText(task.taskStatus);
            final badgeIcon = _getBadgeIcon(task.taskStatus);

            return Container(
              margin: EdgeInsets.only(bottom: screenHeight * 0.015),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: Colors.grey.shade300,
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.08),
                    blurRadius: 8,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.all(screenWidth * 0.04),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.08),
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(12),
                        topRight: Radius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: EdgeInsets.all(screenWidth * 0.025),
                              decoration: BoxDecoration(
                                color: statusColor,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                taskIcon,
                                color: Colors.white,
                                size: screenWidth * 0.05,
                              ),
                            ),
                            SizedBox(width: screenWidth * 0.03),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  taskTitle,
                                  style: TextStyle(
                                    fontSize: screenWidth * 0.032,
                                    color: Colors.black87,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                SizedBox(height: screenWidth * 0.01),
                                Text(
                                  task.taskStatus,
                                  style: TextStyle(
                                    fontSize: screenWidth * 0.028,
                                    color: statusColor,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),

                      ],
                    ),
                  ),
                  
                  Padding(
                    padding: EdgeInsets.all(screenWidth * 0.04),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [

                        
                        Text(
                          'Assigned Technician',
                          style: TextStyle(
                            fontSize: screenWidth * 0.031,
                            color: Colors.black54,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        SizedBox(height: screenWidth * 0.02),
                        Container(
                          padding: EdgeInsets.all(screenWidth * 0.03),
                          decoration: BoxDecoration(
                            color: Colors.grey.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: EdgeInsets.all(screenWidth * 0.02),
                                    decoration: BoxDecoration(
                                      color: theme.colorScheme.primary.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Icon(
                                      Icons.person,
                                      color: theme.colorScheme.primary,
                                      size: screenWidth * 0.045,
                                    ),
                                  ),
                                  SizedBox(width: screenWidth * 0.03),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Name',
                                          style: TextStyle(
                                            fontSize: screenWidth * 0.028,
                                            color: Colors.black54,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        SizedBox(height: screenWidth * 0.005),
                                        Text(
                                          task.technician.name,
                                          style: TextStyle(
                                            color: Colors.black87,
                                            fontWeight: FontWeight.w700,
                                            fontSize: screenWidth * 0.035,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: screenWidth * 0.025),
                              GestureDetector(
                                onTap: () => _makePhoneCall(task.technician.phone),
                                child: Container(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: screenWidth * 0.03,
                                    vertical: screenWidth * 0.02,
                                  ),
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.primary.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.phone,
                                        color: theme.colorScheme.primary,
                                        size: screenWidth * 0.045,
                                      ),
                                      SizedBox(width: screenWidth * 0.02),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Contact',
                                              style: TextStyle(
                                                fontSize: screenWidth * 0.028,
                                                color: Colors.black54,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            SizedBox(height: screenWidth * 0.005),
                                            Text(
                                              task.technician.phone,
                                              style: TextStyle(
                                                color: theme.colorScheme.primary,
                                                fontWeight: FontWeight.w700,
                                                fontSize: screenWidth * 0.035,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Icon(
                                        Icons.arrow_forward_ios,
                                        color: theme.colorScheme.primary,
                                        size: screenWidth * 0.04,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        if (isCompleted) ...[
                          SizedBox(height: screenWidth * 0.03),
                          Container(
                            padding: EdgeInsets.all(screenWidth * 0.03),
                            decoration: BoxDecoration(
                              color: Colors.green.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: Colors.green.withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: EdgeInsets.all(screenWidth * 0.02),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(
                                    Icons.security_outlined,
                                    color: Colors.green,
                                    size: screenWidth * 0.04,
                                  ),
                                ),
                                SizedBox(width: screenWidth * 0.02),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Installation Complete',
                                        style: TextStyle(
                                          fontSize: screenWidth * 0.032,
                                          color: Colors.green,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      SizedBox(height: screenWidth * 0.005),
                                      Text(
                                        'OTP shared with technician',
                                        style: TextStyle(
                                          fontSize: screenWidth * 0.028,
                                          color: Colors.green.withOpacity(0.7),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return const Color(0xFF4CAF50);
      case 'in progress':
        return const Color(0xFFFFC107);
      case 'pending':
        return const Color(0xFFFF5722);
      default:
        return Colors.grey;
    }
  }

  String _getTaskTitle(int taskType) {
    switch (taskType) {
      case 1:
        return 'Installation';
      case 2:
        return 'Service';
      case 3:
        return 'Recharge';
      default:
        return 'Task';
    }
  }

  IconData _getTaskIcon(int taskType) {
    switch (taskType) {
      case 1:
        return Icons.build;
      case 2:
        return Icons.build_circle;
      case 3:
        return Icons.flash_on;
      default:
        return Icons.task_alt;
    }
  }

  String _getBadgeText(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'Done';
      case 'in progress':
        return 'In Progress';
      default:
        return 'Pending';
    }
  }

  IconData _getBadgeIcon(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return Icons.check_circle;
      case 'in progress':
        return Icons.update;
      default:
        return Icons.pending_actions;
    }
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri launchUri = Uri(
      scheme: 'tel',
      path: phoneNumber,
    );
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    }
  }

  void _navigateToRecharge(Order order) {
    try {
      final sessionController = Get.find<SessionController>();
      final token = sessionController.token.value;
      final userId = sessionController.userId.value;
      final emailId = sessionController.emailId.value;

      final data = {
        'token': token,
        'user': {
          'email': emailId,
          'user_id': userId,
        }
      };

      final encodedData = Uri.encodeComponent(jsonEncode(data));
      final baseUrl = dotenv.env['BASE_URL_WEBVIEW'] ?? 'http://192.168.0.16:5050/';
      final finalUrl = '${baseUrl}?data=$encodedData';

      debugPrint("✅ Recharge WebView loading URL: $finalUrl");

      final WebViewController rechargeController = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageStarted: (url) => debugPrint('🌐 Recharge WebView started: $url'),
            onPageFinished: (url) => debugPrint('✅ Recharge WebView finished: $url'),
            onWebResourceError: (error) {
              Get.snackbar('Error', 'Failed to load recharge page');
            },
          ),
        )
        ..loadRequest(Uri.parse(finalUrl));

      Get.to(
        () => WebViewScreen(controller: rechargeController),
        transition: Transition.rightToLeft,
        duration: const Duration(milliseconds: 300),
      );
    } catch (e) {
      Get.snackbar('Error', 'Failed to open recharge page: ${e.toString()}');
    }
  }

  String? _resolveExpiryDate(Order order) {
    final planEndDate = order.planConfig?.endDate;
    if (planEndDate != null && planEndDate.isNotEmpty) {
      return planEndDate;
    }
    return order.subscriptionExpiryDate.isNotEmpty ? order.subscriptionExpiryDate : null;
  }

  String _formatSubscriptionDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) {
      return 'N/A';
    }
    try {
      final DateTime date = DateTime.parse(dateString);
      return DateFormat('dd MMM yyyy').format(date);
    } catch (e) {
      return 'N/A';
    }
  }

  bool _isSubscriptionExpired(Order order) {
    final expiryDateString = _resolveExpiryDate(order);
    if (expiryDateString == null || expiryDateString.isEmpty) {
      return false;
    }
    try {
      final DateTime expiryDate = DateTime.parse(expiryDateString);
      return DateTime.now().isAfter(expiryDate);
    } catch (e) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    Get.lazyPut(() => SubscriptionListController());
    Get.lazyPut(() => SettingsController());
    final settingsController = Get.find<SettingsController>();
    final subscriptionController = Get.find<SubscriptionListController>();
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Order History'),
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
            final isExpired = _isSubscriptionExpired(order);
            final modelType = order.modelType?.toLowerCase();
            final isSmartModel = modelType != null && modelType.trim() == 'smart';
            final shouldShowRecharge = isSmartModel && isExpired;

            return GestureDetector(
              onTap: () {
                _showDetailsBottomSheet(context, order);
              },
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.grey.withOpacity(0.12),
                      blurRadius: 10,
                      spreadRadius: 1,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Padding(
                  padding: EdgeInsets.all(screenWidth * 0.04),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  order.modelName ?? 'Unknown Model',
                                  style: TextStyle(
                                    fontSize: screenWidth * 0.042,
                                    fontWeight: FontWeight.bold,
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                                SizedBox(height: screenWidth * 0.008),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.devices_other,
                                      size: screenWidth * 0.035,
                                      color: Colors.black54,
                                    ),
                                    SizedBox(width: screenWidth * 0.01),
                                    Text(
                                      'ID: ${order.wpDeviceId ?? 'N/A'}',
                                      style: TextStyle(
                                        fontSize: screenWidth * 0.032,
                                        color: Colors.black54,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          SizedBox(width: screenWidth * 0.02),
                          // Status badge
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: screenWidth * 0.025,
                              vertical: screenWidth * 0.015,
                            ),
                            decoration: BoxDecoration(
                              color: isExpired
                                  ? Colors.red.withOpacity(0.2)
                                  : Colors.green.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              isExpired ? 'Expired' : 'Active',
                              style: TextStyle(
                                fontSize: screenWidth * 0.028,
                                color: isExpired ? Colors.red : Colors.green,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: screenWidth * 0.015),
                      Text(
                        'Plan: ${order.selectedPlan.label ?? 'N/A'} (${order.selectedPlan.capacity}L)',
                        style: TextStyle(
                          fontSize: screenWidth * 0.035,
                          color: Colors.black87,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(height: screenWidth * 0.008),
                      Text(
                        'Duration: ${order.selectedDuration.durationTimeLimit ?? 'N/A'}',
                        style: TextStyle(
                          fontSize: screenWidth * 0.035,
                          color: Colors.black87,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(height: screenWidth * 0.008),

                      // Subscription Expiry Date
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Subscription Expiry Date:',
                            style: TextStyle(
                              fontSize: screenWidth * 0.032,
                              color: Colors.black87,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Text(
                            _formatSubscriptionDate(_resolveExpiryDate(order)),
                            style: TextStyle(
                              fontSize: screenWidth * 0.032,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: screenWidth * 0.015),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            onTap: () {
                              _showDetailsBottomSheet(context, order);
                            },
                            child: Row(
                              children: [
                                Text(
                                  'View Details',
                                  style: TextStyle(
                                    fontSize: screenWidth * 0.032,
                                    color: theme.colorScheme.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                SizedBox(width: screenWidth * 0.015),
                                Icon(
                                  Icons.keyboard_arrow_up,
                                  size: screenWidth * 0.05,
                                  color: theme.colorScheme.primary,
                                ),
                              ],
                            ),
                          ),
                          if (shouldShowRecharge)
                            ElevatedButton.icon(
                              onPressed: () => _navigateToRecharge(order),
                              icon: Icon(Icons.refresh, size: screenWidth * 0.032),
                              label: Text(
                                'Recharge',
                                style: TextStyle(fontSize: screenWidth * 0.026),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blue,
                                foregroundColor: Colors.white,
                                padding: EdgeInsets.symmetric(
                                  horizontal: screenWidth * 0.025,
                                  vertical: screenWidth * 0.008,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(6),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
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

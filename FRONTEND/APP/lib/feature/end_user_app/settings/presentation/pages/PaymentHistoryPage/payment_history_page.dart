import 'package:ionhive_water_purifier/feature/end_user_app/settings/domain/models/payment_history_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/controllers/settings_controller.dart';
import 'package:ionhive_water_purifier/utils/widgets/error/error_display_widget.dart';
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

class PaymentHistoryPage extends StatelessWidget {
  const PaymentHistoryPage({super.key});

  Widget _buildShimmerLoading(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return ListView.separated(
      padding: EdgeInsets.symmetric(
        vertical: screenHeight * 0.02,
        horizontal: screenWidth * 0.04,
      ),
      itemCount: 3, // Show 3 shimmer placeholders to simulate multiple payments
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
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
                // Order ID and Amount
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: screenWidth * 0.3,
                      height: screenWidth * 0.04,
                      color: Colors.grey,
                    ),
                    Container(
                      width: screenWidth * 0.2,
                      height: screenWidth * 0.045,
                      color: Colors.grey,
                    ),
                  ],
                ),
                SizedBox(height: screenWidth * 0.02),
                // Time
                Container(
                  width: screenWidth * 0.5,
                  height: screenWidth * 0.035,
                  color: Colors.grey,
                ),
                SizedBox(height: screenWidth * 0.01),
                // Status with Icon
                Row(
                  children: [
                    Container(
                      width: screenWidth * 0.05,
                      height: screenWidth * 0.05,
                      color: Colors.grey,
                    ),
                    SizedBox(width: screenWidth * 0.02),
                    Container(
                      width: screenWidth * 0.2,
                      height: screenWidth * 0.035,
                      color: Colors.grey,
                    ),
                  ],
                ),
              ],
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
  }

  @override
  Widget build(BuildContext context) {
    final settingsController = Get.find<SettingsController>();

    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment History'),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
      ),
      body: Column(
        children: [
          _FilterDropdown(
            settingsController: settingsController,
            screenWidth: screenWidth,
            screenHeight: screenHeight,
          ),
          Expanded(
            child: Obx(() {
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

              final allPayments = settingsController.paymentHistoryList;
              if (allPayments.isEmpty) {
                return Center(
                  child: DisplayWidget(
                    errorMessage: "No payment history found.",
                    assetPath: 'assets/icons/Pyament_not_found.png',
                  ),
                );
              }

              final filteredPayments = _FilterDropdownState.filteredPayments;
              if (filteredPayments.isEmpty) {
                return DisplayWidget(
                  errorMessage: 'No payments found for this period.',
                  assetPath: 'assets/icons/Pyament_not_found.png',
                );
              }

              return ListView.separated(
                padding: EdgeInsets.symmetric(
                  vertical: screenHeight * 0.02,
                  horizontal: screenWidth * 0.04,
                ),
                itemCount: filteredPayments.length,
                itemBuilder: (context, index) {
                  final payment = filteredPayments[index];
                  return _buildPaymentEntry(
                    payment: payment,
                    theme: theme,
                    screenWidth: screenWidth,
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
          ),
        ],
      ),
    );
  }
}

class _FilterDropdown extends StatefulWidget {
  final SettingsController settingsController;
  final double screenWidth;
  final double screenHeight;

  const _FilterDropdown({
    required this.settingsController,
    required this.screenWidth,
    required this.screenHeight,
  });

  @override
  State<_FilterDropdown> createState() => _FilterDropdownState();
}

class _FilterDropdownState extends State<_FilterDropdown> {
  String _selectedFilter = 'All';
  final List<String> _filterOptions = [
    'All',
    'Last 7 Days',
    'Last 30 Days',
    'Last 90 Days',
  ];
  static RxList<PaymentHistory> filteredPayments = <PaymentHistory>[].obs;

  void _updateFilteredPayments() {
    final now = DateTime.now();
    final allPayments = widget.settingsController.paymentHistoryList;
    switch (_selectedFilter) {
      case 'Last 7 Days':
        filteredPayments.value = allPayments
            .where((payment) => now.difference(payment.createdAt).inDays <= 7)
            .toList();
        break;
      case 'Last 30 Days':
        filteredPayments.value = allPayments
            .where((payment) => now.difference(payment.createdAt).inDays <= 30)
            .toList();
        break;
      case 'Last 90 Days':
        filteredPayments.value = allPayments
            .where((payment) => now.difference(payment.createdAt).inDays <= 90)
            .toList();
        break;
      case 'All':
      default:
        filteredPayments.value = allPayments.toList();
        break;
    }
  }

  @override
  void initState() {
    super.initState();
    _updateFilteredPayments();
    ever(widget.settingsController.paymentHistoryList, (_) {
      _updateFilteredPayments();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(
        vertical: widget.screenHeight * 0.02,
        horizontal: widget.screenWidth * 0.04,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Text(
            'Filter: ',
            style: TextStyle(
              fontSize: widget.screenWidth * 0.04,
              color: Colors.black54,
            ),
          ),
          Container(
            padding:
                EdgeInsets.symmetric(horizontal: widget.screenWidth * 0.02),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                dropdownColor: Colors.white,
                focusColor: Colors.white,
                value: _selectedFilter,
                onChanged: (String? newValue) {
                  setState(() {
                    _selectedFilter = newValue!;
                    _updateFilteredPayments();
                  });
                },
                items: _filterOptions
                    .map<DropdownMenuItem<String>>((String value) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text(
                      value,
                      style: TextStyle(fontSize: widget.screenWidth * 0.04),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

Widget _buildPaymentEntry({
  required PaymentHistory payment,
  required ThemeData theme,
  required double screenWidth,
}) {
  final dateFormat = DateFormat('dd MMM yyyy, hh:mm a');
  final localCreatedAt = payment.createdAt.toLocal();
  final paymentStatus = payment.paymentStatus ?? 'Pending';
  final isCompleted = paymentStatus.toLowerCase() == 'completed';
  final orderId = payment.orderId ?? 'N/A';
  final displayOrderId = orderId.length > 8 ? '${orderId.substring(0, 8)}...' : orderId;

  return Container(
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
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Order ID: $displayOrderId',
              style: TextStyle(
                fontSize: screenWidth * 0.04,
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.primary,
              ),
            ),
            Text(
              '₹${(payment.totalPrice ?? 0.0).toStringAsFixed(2)}',
              style: TextStyle(
                fontSize: screenWidth * 0.045,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        SizedBox(height: screenWidth * 0.02),
        Text(
          'Time: ${dateFormat.format(localCreatedAt)}',
          style: TextStyle(
            fontSize: screenWidth * 0.035,
            color: Colors.black54,
          ),
        ),
        SizedBox(height: screenWidth * 0.01),
        Row(
          children: [
            Icon(
              isCompleted ? Icons.check_circle : Icons.access_time,
              color: isCompleted ? Colors.green : Colors.orange,
              size: screenWidth * 0.05,
            ),
            SizedBox(width: screenWidth * 0.02),
            Text(
              paymentStatus,
              style: TextStyle(
                fontSize: screenWidth * 0.035,
                color: isCompleted ? Colors.green : Colors.orange,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

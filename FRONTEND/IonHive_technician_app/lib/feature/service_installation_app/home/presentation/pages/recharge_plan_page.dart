import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ionhive_technician_app/core/core.dart';
import 'package:ionhive_technician_app/core/controllers/session_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/models/home_model.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/controllers/home_controller.dart';
import 'package:intl/intl.dart';
import 'task_details_page.dart';

class RechargePlanPage extends StatefulWidget {
  final ProductWithPlans product;
  final Task task;
  final Map<String, dynamic>? subscription;

  const RechargePlanPage({super.key, required this.product, required this.task, this.subscription});

  @override
  State<RechargePlanPage> createState() => _RechargePlanPageState();
}

class _RechargePlanPageState extends State<RechargePlanPage> {
  ProductDuration? _selectedDuration;
  ProductPlan? _selectedPlan;
  bool _isCreatingRechargeOrder = false;

  Color _getConnectivityColor(String? connectivity) {
    if (connectivity == null) return Colors.grey.shade600;
    final lower = connectivity.toLowerCase();
    if (lower.contains('bluetooth') || lower.contains('bt')) {
      return Colors.green.shade600;
    } else if (lower.contains('wifi') || lower.contains('wi-fi') || lower.contains('wireless')) {
      return Colors.blue.shade600;
    } else {
      return Colors.orange.shade600;
    }
  }

  IconData _getConnectivityIcon(String? connectivity) {
    if (connectivity == null) return Icons.wifi;
    final lower = connectivity.toLowerCase();
    if (lower.contains('bluetooth') || lower.contains('bt')) {
      return Icons.bluetooth;
    } else if (lower.contains('wifi') || lower.contains('wi-fi') || lower.contains('wireless')) {
      return Icons.wifi;
    } else {
      return Icons.settings_remote;
    }
  }

  Widget _buildSummaryRow(String title, String value, {bool isDiscount = false, bool isTotal = false}) {
    final titleStyle = TextStyle(
      fontSize: 12,
      fontWeight: isTotal ? FontWeight.w600 : FontWeight.w500,
      color: isDiscount ? Colors.red.shade600 : Colors.black87,
    );
    final valueStyle = TextStyle(
      fontSize: 12,
      fontWeight: isTotal ? FontWeight.w700 : FontWeight.w500,
      color: isDiscount ? Colors.red.shade600 : Colors.black87,
    );

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              title,
              style: titleStyle,
            ),
          ),
          const SizedBox(width: 12),
          Text(
            value,
            style: valueStyle,
          ),
        ],
      ),
    );
  }

  Map<String, double> _calculatePrices() {
    final planPrice = (_selectedPlan?.price ?? 0).toDouble();
    final gstPercent = (_selectedDuration?.gst ?? 0).toDouble();
    final discountPercent = (_selectedDuration?.discount ?? 0).toDouble();

    final subtotal = planPrice;
    final discountAmount = (subtotal * discountPercent) / 100;
    final discountedPrice = subtotal - discountAmount;
    final gstAmount = (discountedPrice * gstPercent) / 100;
    final grandTotal = discountedPrice + gstAmount;

    return {
      'subtotal': subtotal,
      'discountAmount': discountAmount,
      'gstAmount': gstAmount,
      'grandTotal': grandTotal,
      'discountedPrice': discountedPrice,
      'priceWithGST': grandTotal,
      'price': planPrice,
    };
  }

  Map<String, dynamic> _sanitizeAddress(Map<String, dynamic>? source) {
    if (source == null) return {};
    final sanitized = <String, dynamic>{};
    source.forEach((key, value) {
      if (value == null) return;
      if (value is String && value.trim().isEmpty) return;
      sanitized[key] = value;
    });
    return sanitized;
  }

  Map<String, dynamic> _resolveDeliveryAddress() {
    final primary = _sanitizeAddress(widget.task.address?.toJson());
    if (primary.isNotEmpty) return primary;
    final rechargeAddress = widget.task.rechargeDetails?['deliveryAddress'];
    if (rechargeAddress is Map<String, dynamic>) {
      return _sanitizeAddress(Map<String, dynamic>.from(rechargeAddress));
    }
    return {};
  }

  String? _resolveModelType() {
    if (widget.product.modelType != null && widget.product.modelType!.trim().isNotEmpty) {
      return widget.product.modelType;
    }
    final productModelType = widget.task.product?.selectedPlan?['model_type']?.toString();
    if (productModelType != null && productModelType.trim().isNotEmpty) {
      return productModelType;
    }
    return widget.task.modelName;
  }

  String? _formatCurrency(dynamic value) {
    if (value == null) return null;
    final number = value is num ? value.toDouble() : double.tryParse(value.toString());
    if (number == null) return null;
    return '₹${number.toStringAsFixed(2)}';
  }

  String? _formatDateString(String? iso) {
    if (iso == null || iso.isEmpty) return null;
    try {
      final date = DateTime.parse(iso).toLocal();
      return DateFormat('dd MMM yyyy').format(date);
    } catch (_) {
      return null;
    }
  }

  String? _findValue(Map<String, dynamic>? map, List<String> keys) {
    if (map == null) return null;
    for (final key in keys) {
      if (key.isEmpty) continue;
      final value = map[key];
      if (value == null) continue;
      final stringValue = value.toString();
      if (stringValue.isEmpty) continue;
      return stringValue;
    }
    return null;
  }

  Widget _buildInfoTile(String title, String value, {Color? valueColor}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: Colors.grey.shade600,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: valueColor ?? Colors.black87,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final subscription = widget.subscription;
    final selectedPlanMap = subscription != null && subscription['selectedPlan'] is Map
        ? Map<String, dynamic>.from(subscription['selectedPlan'] as Map)
        : null;
    final selectedDurationMap = subscription != null && subscription['selectedDuration'] is Map
        ? Map<String, dynamic>.from(subscription['selectedDuration'] as Map)
        : null;
    final planNameParts = <String>[];
    if (selectedPlanMap?['label'] != null && selectedPlanMap!['label'].toString().isNotEmpty) {
      planNameParts.add(selectedPlanMap['label'].toString());
    }
    final capacityValue = selectedPlanMap?['capacity']?.toString();
    if (capacityValue != null && capacityValue.isNotEmpty) {
      planNameParts.add(capacityValue);
    }
    final planName = planNameParts.isEmpty ? null : planNameParts.join(' · ');
    final durationLabel = _findValue(selectedDurationMap, [
      'duration_time_limit',
      'durationTimeLimit',
      'duration',
      'durationLabel',
    ]);
    final lastRechargeDate = _formatDateString(_findValue(subscription, [
      'subscribed_at',
      'subscribedAt',
      'lastRechargeAt',
      'lastRechargeDate',
      'createdAt',
    ]));
    final expiryDate = _formatDateString(_findValue(subscription, [
      'subscriptionExpiryDate',
      'subscription_expiry_date',
      'subscriptionExpiry',
      'expiryDate',
      'expiresAt',
    ]));
    final planAmount = _formatCurrency(
      subscription?['grandTotal'] ??
          selectedPlanMap?['price'] ??
          subscription?['price'] ??
          subscription?['subtotal'],
    );
    final infoTiles = <Widget>[
      if (durationLabel != null) _buildInfoTile('Duration', durationLabel!, valueColor: Colors.blue.shade700),
      if (lastRechargeDate != null)
        _buildInfoTile('Last Recharge', lastRechargeDate!, valueColor: Colors.grey.shade700),
      if (expiryDate != null) _buildInfoTile('Expires On', expiryDate!, valueColor: Colors.red.shade500),
    ];

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        backgroundColor: Colors.blue.shade600,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Get.back(),
        ),
        title: Text(
          widget.product.modelName ?? 'Recharge Plan',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.product.modelName ?? 'N/A',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.product.productDetails ?? 'No description available',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(
                        _getConnectivityIcon(widget.product.connectivity),
                        size: 14,
                        color: _getConnectivityColor(widget.product.connectivity),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${widget.product.connectivity ?? 'N/A'}',
                          style: TextStyle(
                            fontSize: 11,
                            color: _getConnectivityColor(widget.product.connectivity),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Icon(Icons.smartphone, size: 14, color: Colors.grey.shade600),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${widget.product.modelType ?? 'N/A'}',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey.shade600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (subscription != null && (planAmount != null || planName != null || infoTiles.isNotEmpty)) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Last Recharge Plan',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.black87,
                                ),
                              ),
                              if (planName != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  planName!,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.grey.shade700,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (planAmount != null)
                          Text(
                            planAmount!,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.green.shade700,
                            ),
                          ),
                      ],
                    ),
                    if (infoTiles.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final maxWidth = constraints.maxWidth;
                          final spacing = 10.0;
                          final twoColumnWidth = maxWidth <= spacing ? maxWidth : (maxWidth - spacing) / 2;
                          final tileWidth = infoTiles.length == 1 ? maxWidth : twoColumnWidth;
                          return Wrap(
                            spacing: spacing,
                            runSpacing: spacing,
                            children: infoTiles
                                .map(
                                  (tile) => SizedBox(
                                    width: tileWidth,
                                    child: tile,
                                  ),
                                )
                                .toList(),
                          );
                        },
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Select Duration',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: (widget.product.duration ?? []).map((duration) {
                      final isSelected = _selectedDuration == duration;
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedDuration = duration;
                            _selectedPlan = null;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Colors.grey.shade300,
                              width: 1,
                            ),
                          ),
                          child: Text(
                            duration.durationTimeLimit ?? 'N/A',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                              color: isSelected ? Colors.blue.shade600 : Colors.black87,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (_selectedDuration != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Select Plan',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _selectedDuration!.plans != null ? _selectedDuration!.plans!.length : 0,
                      itemBuilder: (context, index) {
                        final plan = _selectedDuration!.plans![index];
                        final isSelected = _selectedPlan == plan;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 4),
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: Colors.grey.shade300,
                              width: 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      plan.label ?? 'N/A',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black87,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 1),
                                    Text(
                                      'Capacity: ${plan.capacity ?? 'N/A'}',
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: Colors.grey.shade600,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    if (plan.description != null && plan.description!.isNotEmpty) ...[
                                      const SizedBox(height: 1),
                                      Text(
                                        plan.description!,
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: Colors.grey.shade500,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              Text(
                                '₹${plan.price ?? 0}',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.green.shade600,
                                ),
                              ),
                              const SizedBox(width: 8),
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _selectedPlan = plan;
                                  });
                                },
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  backgroundColor: isSelected ? Colors.blue.shade600 : Colors.blue.shade50,
                                  foregroundColor: isSelected ? Colors.white : Colors.blue.shade600,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  minimumSize: const Size(0, 0),
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: Text(
                                  'Select Plan',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ] else ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.info_outline, color: Colors.grey.shade400, size: 32),
                      const SizedBox(height: 6),
                      Text(
                        'Select a duration to view plans',
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontSize: 12,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ],
            if (_selectedPlan != null && _selectedDuration != null) ...[
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Builder(
                  builder: (context) {
                    final planPrice = _selectedPlan!.price ?? 0;
                    final gstPercent = _selectedDuration!.gst ?? 0;
                    final discountPercent = _selectedDuration!.discount ?? 0;

                    final subtotal = planPrice.toDouble();
                    final discountAmount = (subtotal * discountPercent) / 100;
                    final discountedPrice = subtotal - discountAmount;
                    final gstAmount = (discountedPrice * gstPercent) / 100;
                    final grandTotal = discountedPrice + gstAmount;

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Summary',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.blue.shade800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Column(
                            children: [
                              _buildSummaryRow('Price:', '₹${subtotal.toStringAsFixed(0)}'),
                              if (discountAmount > 0) ...[
                                _buildSummaryRow('Discount (${discountPercent}%):', '-₹${discountAmount.toStringAsFixed(0)}', isDiscount: true),
                              ],
                              _buildSummaryRow('GST (${gstPercent}%):', '₹${gstAmount.toStringAsFixed(0)}'),
                              Divider(height: 12),
                              _buildSummaryRow('Total:', '₹${grandTotal.toStringAsFixed(0)}', isTotal: true),
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isCreatingRechargeOrder
                      ? null
                      : _onRechargeNowPressed,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.shade600,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isCreatingRechargeOrder
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Recharge Now',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _onRechargeNowPressed() async {
    setState(() => _isCreatingRechargeOrder = true);

    final prices = _calculatePrices();
    final controller = Get.find<TechnicianController>();
    final sessionController = Get.find<SessionController>();

    try {
      final response = await controller.createRechargeOrder(
        technicianId: widget.task.assignedTechnicianId!,
        email: sessionController.emailId.value,
        taskId: widget.task.taskId!,
        wpDeviceId: widget.task.wpDeviceId!,
        productModelId: widget.product.id!,
        selectedPlan: _selectedPlan!,
        selectedDuration: _selectedDuration!,
        deliveryAddress: _resolveDeliveryAddress(),
        discountedPrice: prices['discountedPrice']!,
        discountAmount: prices['discountAmount']!,
        gstAmount: prices['gstAmount']!,
        grandTotal: prices['grandTotal']!,
        priceWithGST: prices['priceWithGST']!,
        price: prices['price']!,
        subtotal: prices['subtotal']!,
        codFee: 0.0,
        modelType: _resolveModelType(),
      );

      if (response['error'] == false) {
        final updatedTask = controller.allTasks.firstWhere(
          (task) => task.taskId == widget.task.taskId,
          orElse: () => widget.task,
        );

        Get.off(() => TaskDetailPage(task: updatedTask));
      }
    } catch (e) {
      // Error is handled in the controller
    } finally {
      setState(() => _isCreatingRechargeOrder = false);
    }
  }
}

class RechargeProductSelectionPage extends StatelessWidget {
  final List<ProductWithPlans> products;
  final Task task;
  final Map<String, Map<String, dynamic>> activeSubscriptions;

  const RechargeProductSelectionPage({super.key, required this.products, required this.task, required this.activeSubscriptions});

  Map<String, dynamic>? _subscriptionFor(ProductWithPlans product) {
    final keys = <String?>[
      product.id,
      product.modelId?.toString(),
    ];
    for (final key in keys) {
      if (key == null || key.isEmpty) continue;
      final match = activeSubscriptions[key];
      if (match != null) {
        return match;
      }
    }
    return null;
  }

  String? _formatDate(String? iso) {
    if (iso == null || iso.isEmpty) return null;
    try {
      final date = DateTime.parse(iso).toLocal();
      return DateFormat('dd MMM yyyy').format(date);
    } catch (_) {
      return null;
    }
  }

  String? _formatAmount(dynamic value) {
    if (value == null) return null;
    final amount = value is num ? value.toDouble() : double.tryParse(value.toString());
    if (amount == null) return null;
    return '₹${amount.toStringAsFixed(2)}';
  }

  String? _pickValue(Map<String, dynamic>? map, List<String> keys) {
    if (map == null) return null;
    for (final key in keys) {
      if (key.isEmpty) continue;
      final value = map[key];
      if (value == null) continue;
      final stringValue = value.toString();
      if (stringValue.isEmpty) continue;
      return stringValue;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final customerName = task.address?.name?.trim().isNotEmpty == true
        ? task.address!.name!.trim()
        : task.address?.email ?? 'Customer';

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue.shade600,
        title: Text(
          'Recharge Plans - $customerName',
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Get.back(),
        ),
      ),
      body: products.isEmpty
          ? const Center(child: Text('No products available'))
          : ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: products.length,
        itemBuilder: (context, index) {
          final product = products[index];
          final subscription = _subscriptionFor(product);
          final selectedPlan = subscription != null && subscription['selectedPlan'] is Map
              ? Map<String, dynamic>.from(subscription['selectedPlan'] as Map)
              : null;
          final subscribedAt = _formatDate(
            _pickValue(subscription, [
              'subscribed_at',
              'subscribedAt',
              'lastRechargeAt',
              'lastRechargeDate',
              'createdAt',
            ]),
          );
          final expiryDate = _formatDate(
            _pickValue(subscription, [
              'subscriptionExpiryDate',
              'subscription_expiry_date',
              'subscriptionExpiry',
              'expiryDate',
              'expiresAt',
            ]),
          );
          final planAmount = _formatAmount(selectedPlan?['price'] ?? subscription?['grandTotal'] ?? subscription?['price'] ?? subscription?['subtotal']);
          final planLabel = selectedPlan?['label']?.toString();
          final planCapacity = selectedPlan?['capacity']?.toString();

          final planDescriptionParts = <String>[];
          if (planLabel != null && planLabel.isNotEmpty) {
            planDescriptionParts.add(planLabel);
          }
          if (planCapacity != null && planCapacity.isNotEmpty) {
            planDescriptionParts.add(planCapacity);
          }
          final planDescription = planDescriptionParts.isEmpty ? null : planDescriptionParts.join(' · ');

          String? lastRechargeText;
          if (subscribedAt != null || planAmount != null) {
            final parts = <String>[];
            if (subscribedAt != null) {
              parts.add('Last recharge on $subscribedAt');
            }
            if (planAmount != null) {
              parts.add(planAmount);
            }
            lastRechargeText = parts.join(' · ');
          }
          final expiryText = expiryDate != null ? 'Plan expires on $expiryDate' : null;

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          '${Core.baseUrl}/upload/img/${product.mainImg}',
                          width: 60,
                          height: 60,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              width: 60,
                              height: 60,
                              color: Colors.grey.shade200,
                              child: const Icon(
                                Icons.broken_image,
                                color: Colors.grey,
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              product.modelName ?? 'N/A',
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.wifi, size: 12, color: Colors.grey.shade600),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    product.connectivity ?? 'N/A',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      fontSize: 11,
                                      color: Colors.grey.shade600,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Icon(Icons.smartphone, size: 12, color: Colors.grey.shade600),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    product.modelType ?? 'N/A',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      fontSize: 11,
                                      color: Colors.grey.shade600,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: () async {
                          await Get.off(
                            () => RechargePlanPage(
                              product: product,
                              task: task,
                              subscription: subscription != null ? Map<String, dynamic>.from(subscription) : null,
                            ),
                            transition: Transition.rightToLeft,
                            duration: const Duration(milliseconds: 300),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue.shade600,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'Select Plan',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w400,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (subscription != null) ...[
                    const SizedBox(height: 10),
                    Divider(color: Colors.grey.shade200, height: 1),
                    const SizedBox(height: 8),


                    if (lastRechargeText != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        lastRechargeText!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                    if (expiryText != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        expiryText!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontSize: 12,
                          color: Colors.red.shade500,
                        ),
                      ),
                    ],
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
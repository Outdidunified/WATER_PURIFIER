import 'package:equatable/equatable.dart';

class ActiveSubscriptionResponse extends Equatable {
  final bool error;
  final String message;
  final List<SubscriptionItem> data;

  const ActiveSubscriptionResponse({
    required this.error,
    required this.message,
    required this.data,
  });

  factory ActiveSubscriptionResponse.fromJson(Map<String, dynamic> json) {
    final rawData = json['data'];

    List<SubscriptionItem> parsedData = [];

    if (rawData is List) {
      // ✅ API returned a list
      parsedData = rawData
          .map((e) => SubscriptionItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } else if (rawData is Map<String, dynamic>) {
      // ✅ API returned an object
      final subscription = rawData['subscription'];
      if (subscription != null) {
        parsedData = [SubscriptionItem.fromJson(subscription)];
      } else {
        parsedData = []; // empty if subscription is null
      }
    }

    return ActiveSubscriptionResponse(
      error: json['error'] as bool? ?? true,
      message: json['message'] as String? ?? 'Unknown error',
      data: parsedData,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'error': error,
      'message': message,
      'data': data.map((e) => e.toJson()).toList(),
    };
  }

  @override
  List<Object?> get props => [error, message, data];
}

class SubscriptionItem extends Equatable {
  final String wpDeviceId;
  final String? modelType;

  const SubscriptionItem({
    required this.wpDeviceId,
    this.modelType,
  });

  factory SubscriptionItem.fromJson(Map<String, dynamic> json) {
    final deviceId = json['wp_device_id'] ?? json['wpDeviceId'] ?? '';
    final type = json['modeltype'] ?? json['modelType'];
    return SubscriptionItem(
      wpDeviceId: deviceId.toString(),
      modelType: type != null ? type.toString() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'wp_device_id': wpDeviceId,
      'modeltype': modelType,
    };
  }

  @override
  List<Object?> get props => [wpDeviceId, modelType];
}

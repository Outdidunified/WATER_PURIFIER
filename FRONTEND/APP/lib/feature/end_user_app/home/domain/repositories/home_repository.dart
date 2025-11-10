import 'package:ionhive_water_purifier/feature/end_user_app/home/data/api.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/models/home_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/models/device_model.dart';

class SubscriptionRepository {
  final SubscriptionApi _api = SubscriptionApi();

  Future<ActiveSubscriptionResponse> getActiveSubscription() async {
    final json = await _api.fetchActiveSubscription();
    return ActiveSubscriptionResponse.fromJson(json);
  }

  Future<OrdersResponse> getOrdersByUserId() async {
    final json = await _api.fetchActiveSubscription();
    return OrdersResponse.fromJson(json);
  }

  Future<DeviceResponse> getLatestFeatureValues({
    required int userId,
    required String wpDeviceId,
  }) async {
    final json = await _api.fetchLatestFeatureValues(
      userId: userId,
      wpDeviceId: wpDeviceId,
    );
    return DeviceResponse.fromJson(json);
  }

  Future<DeviceResponse> getTelemetryData({
    required String wpDeviceId,
  }) async {
    final json = await _api.fetchTelemetryData(
      wpDeviceId: wpDeviceId,
    );
    // Map the telemetry response to DeviceResponse format
    final mappedJson = {
      'error': json['status'] != 'Success',
      'message': json['message'] as String? ?? 'Unknown error',
      'data': json['data'],
    };
    return DeviceResponse.fromJson(mappedJson);
  }

  Future<Map<String, dynamic>> storeBleAck(Map<String, dynamic> payload) async {
    return await _api.storeBleAck(payload);
  }
}

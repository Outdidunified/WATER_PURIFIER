import 'package:aquapulse_app/feature/end_user_app/home/data/api.dart';
import 'package:aquapulse_app/feature/end_user_app/home/domain/models/home_model.dart';
import 'package:aquapulse_app/feature/end_user_app/home/domain/models/device_model.dart';

class SubscriptionRepository {
  final SubscriptionApi _api = SubscriptionApi();

  Future<ActiveSubscriptionResponse> getActiveSubscription() async {
    final json = await _api.fetchActiveSubscription();
    return ActiveSubscriptionResponse.fromJson(json);
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
}

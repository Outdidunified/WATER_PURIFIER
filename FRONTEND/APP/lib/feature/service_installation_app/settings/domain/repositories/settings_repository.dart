// feature/service_installation_app/settings/data/settings_repository.dart
import 'package:aquapulse_app/feature/service_installation_app/settings/data/api.dart';
import 'package:aquapulse_app/feature/service_installation_app/settings/domain/models/settings_model.dart';

class RepositoryResponse<T> {
  final bool error;
  final String? message;
  final T? data;

  RepositoryResponse({required this.error, this.message, this.data});
}

class SettingsRepository {
  final SettingsApi _api = SettingsApi();

  Future<RepositoryResponse<TechnicianDetailsModel>> fetchUserDetails(
      int userId) async {
    try {
      final json = await _api.fetchUserDetails();
      final responseData = json['data'] as Map<String, dynamic>? ?? {};
      final bool error = json['error'] as bool? ?? true;
      final String? message = json['message'] as String?;

      if (!error && responseData.isNotEmpty) {
        final userDetails = TechnicianDetailsModel.fromJson(responseData);
        return RepositoryResponse<TechnicianDetailsModel>(
          error: false,
          message: message ?? 'User details fetched successfully',
          data: userDetails,
        );
      } else {
        return RepositoryResponse<TechnicianDetailsModel>(
          error: true,
          message: message ?? 'Failed to fetch user details',
          data: null,
        );
      }
    } catch (e) {
      return RepositoryResponse<TechnicianDetailsModel>(
        error: true,
        message: 'Error: ${e.toString()}',
        data: null,
      );
    }
  }

  Future<RepositoryResponse<void>> updateUserDetails({
    required int userId,
    required String email,
    required String name,
    required int phone,
    required String city,
  }) async {
    try {
      final json = await _api.updateUserDetails(
        userId: userId,
        email: email,
        name: name,
        phone: phone,
        city: city,
      );
      final bool error = json['error'] as bool? ?? true;
      final String? message = json['message'] as String?;

      return RepositoryResponse<void>(
        error: error,
        message: message ??
            (error
                ? 'Failed to update user details'
                : 'User details updated successfully'),
        data: null,
      );
    } catch (e) {
      return RepositoryResponse<void>(
        error: true,
        message: 'Error: ${e.toString()}',
        data: null,
      );
    }
  }
}
